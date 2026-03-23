import dotenv from 'dotenv';
dotenv.config();

import Anthropic from '@anthropic-ai/sdk';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3.js';
import Profile from '../models/Profile.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Stream an S3 object to a Buffer
const getS3ImageBuffer = async (key) => {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key })
  );
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const SYSTEM_PROMPT = `You are a highly knowledgeable Vedic astrologer specializing in Kundali matching (Vivah Milan / Kundali Milan).
You will be given two horoscope chart images (patrika / janampatri / kundali) together with structured profile data for each person. The charts may be in Marathi, Hindi, Sanskrit, or English.

The structured profile data (Name, Date of Birth, Time of Birth, Place of Birth, Religion, Caste, etc.) provided by the administrator is ALWAYS the primary and authoritative source. Always use it first. The patrika image is a secondary visual reference — use it only to extract planetary positions, house placements, Rashi, Nakshatra, and Lagna that cannot be derived from text alone. If the patrika image shows different birth details (DOB, TOB, POB) than the structured data, ALWAYS prefer the structured data. Never override or second-guess the structured data with what is printed on the chart. Religion, caste, education, and occupation provide important socio-cultural context for the analysis.

For EACH profile:
1. Take Name, Date of Birth, Time of Birth, and Place of Birth directly from the structured data — do not read these from the chart image. Date of Birth is in YYYY-MM-DD format (e.g. 1995-07-23). Time of Birth is in HH:MM:SS AM/PM format (e.g. 06:45:00 AM).
2. Use the chart image to determine:
   - Rashi (Moon Sign / Chandra Rashi)
   - Nakshatra (birth star) and Pada (quarter)
   - Lagna (Ascendant / Rising sign)
   - Positions of all 9 Grahas (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) in their respective houses
3. If the chart image is unclear or missing any planetary data, compute it from the structured DOB/TOB/POB and note the estimation.

Then perform the Ashtakoot Milan (36-point compatibility analysis):
1. Varna (1 point max)
2. Vashya (2 points max)
3. Tara / Dina (3 points max)
4. Yoni (4 points max)
5. Graha Maitri / Rashyadhipati (5 points max)
6. Gana (6 points max)
7. Bhakut / Rashikoot (7 points max)
8. Nadi (8 points max)

Also check:
- Mangal Dosha for each profile (Mars in 1st, 2nd, 4th, 7th, 8th, or 12th house from Lagna, Moon, or Venus)
- Whether any Dosha cancellation (Mangal Dosha Nivaran) applies

If certain information cannot be clearly read from the chart images, make a reasonable professional estimate and note it. Do NOT refuse — always provide your best analysis.

IMPORTANT: Respond ONLY with valid JSON matching this exact schema (no markdown, no explanation outside the JSON):
{
  "profileA": {
    "name": "...",
    "dob": "...",
    "tob": "...",
    "pob": "...",
    "rashi": "...",
    "nakshatra": "...",
    "nakshatra_pada": "...",
    "lagna": "...",
    "planet_positions": {
      "Sun": "House N (Rashi)",
      "Moon": "House N (Rashi)",
      "Mars": "House N (Rashi)",
      "Mercury": "House N (Rashi)",
      "Jupiter": "House N (Rashi)",
      "Venus": "House N (Rashi)",
      "Saturn": "House N (Rashi)",
      "Rahu": "House N (Rashi)",
      "Ketu": "House N (Rashi)"
    }
  },
  "profileB": { <same structure as profileA> },
  "ashtakoot": {
    "varna":        { "points": 0, "max": 1, "details": "..." },
    "vashya":       { "points": 0, "max": 2, "details": "..." },
    "tara":         { "points": 0, "max": 3, "details": "..." },
    "yoni":         { "points": 0, "max": 4, "details": "..." },
    "graha_maitri": { "points": 0, "max": 5, "details": "..." },
    "gana":         { "points": 0, "max": 6, "details": "..." },
    "bhakut":       { "points": 0, "max": 7, "details": "..." },
    "nadi":         { "points": 0, "max": 8, "details": "..." },
    "total":        { "points": 0, "max": 36 }
  },
  "mangal_dosha": {
    "profile_a": false,
    "profile_b": false,
    "cancellation": false,
    "details": "..."
  },
  "summary": "...",
  "recommendation": "HIGHLY_RECOMMENDED",
  "compatibility_percentage": 72
}

Allowed recommendation values: "HIGHLY_RECOMMENDED", "RECOMMENDED", "AVERAGE", "NOT_RECOMMENDED"`;

// Build a concise text summary of a profile's form data for the AI prompt
const buildProfileContext = (p) => {
  const lines = [`Name: ${p.name}`];
  if (p.dateOfBirth)   lines.push(`Date of Birth: ${p.dateOfBirth}`);
  if (p.timeOfBirth)   lines.push(`Time of Birth: ${p.timeOfBirth}`);
  if (p.birthLocation) lines.push(`Place of Birth: ${p.birthLocation}`);
  if (p.age)           lines.push(`Age: ${p.age}`);
  if (p.gender)        lines.push(`Gender: ${p.gender}`);
  if (p.religion)      lines.push(`Religion: ${p.religion}`);
  if (p.caste)         lines.push(`Caste/Gotra: ${p.caste}`);
  if (p.education)     lines.push(`Education: ${p.education}`);
  if (p.occupation)    lines.push(`Occupation: ${p.occupation}`);
  if (p.location)      lines.push(`Current Location: ${p.location}`);
  return lines.join('\n');
};

const detectMimeType = (key) => {
  if (/\.png$/i.test(key)) return 'image/png';
  if (/\.webp$/i.test(key)) return 'image/webp';
  if (/\.gif$/i.test(key)) return 'image/gif';
  return 'image/jpeg'; // fallback: jpg / jpeg
};

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  gu: 'Gujarati',
};

// POST /api/profiles/match
export const matchProfiles = async (req, res) => {
  try {
    const { profileAId, profileBId, language = 'en' } = req.body;
    const languageName = LANGUAGE_NAMES[language] || 'English';
    if (!profileAId || !profileBId) {
      return res.status(400).json({ message: 'Both profileAId and profileBId are required' });
    }
    if (profileAId === profileBId) {
      return res.status(400).json({ message: 'Cannot match a profile with itself' });
    }

    const [profileA, profileB] = await Promise.all([
      Profile.findById(profileAId),
      Profile.findById(profileBId),
    ]);

    if (!profileA) return res.status(404).json({ message: `Profile A not found` });
    if (!profileB) return res.status(404).json({ message: `Profile B not found` });
    if (!profileA.patrikaImage?.key) return res.status(422).json({ message: `${profileA.name} does not have a patrika image uploaded` });
    if (!profileB.patrikaImage?.key) return res.status(422).json({ message: `${profileB.name} does not have a patrika image uploaded` });

    // Fetch both patrika images from S3 in parallel
    const [bufA, bufB] = await Promise.all([
      getS3ImageBuffer(profileA.patrikaImage.key),
      getS3ImageBuffer(profileB.patrikaImage.key),
    ]);

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `=== Profile A — Structured Data ===\n${buildProfileContext(profileA)}\n\nThe patrika (horoscope chart) for Profile A follows. Use the structured data above as the authoritative reference for birth details when reading the chart.`,
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: detectMimeType(profileA.patrikaImage.key),
                data: bufA.toString('base64'),
              },
            },
            {
              type: 'text',
              text: `=== Profile B — Structured Data ===\n${buildProfileContext(profileB)}\n\nThe patrika (horoscope chart) for Profile B follows. Use the structured data above as the authoritative reference for birth details when reading the chart.`,
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: detectMimeType(profileB.patrikaImage.key),
                data: bufB.toString('base64'),
              },
            },
            {
              type: 'text',
              text: `Now analyze both profiles using the structured data and patrika charts above, and return the full compatibility report as JSON.\n\nIMPORTANT: Write all narrative text fields — the "summary" field and every "details" value inside "ashtakoot" and "mangal_dosha" — in ${languageName}. All JSON field names and keys must remain in English.`,
            },
          ],
        },
      ],
    });

    // Extract the text block (skip any thinking blocks)
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) {
      console.error('Claude response had no text block. stop_reason:', response.stop_reason, 'blocks:', response.content.map((b) => b.type));
      return res.status(500).json({ message: `AI returned no text (stop_reason: ${response.stop_reason}). Try again.` });
    }

    // Strip possible markdown code fences
    const jsonText = textBlock.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const report = JSON.parse(jsonText);

    // Fill in profile metadata from form data when the AI left fields blank
    report.profileA.name = report.profileA.name || profileA.name;
    report.profileA.dob  = report.profileA.dob  || profileA.dateOfBirth  || '';
    report.profileA.tob  = report.profileA.tob  || profileA.timeOfBirth  || '';
    report.profileA.pob  = report.profileA.pob  || profileA.birthLocation || '';
    report.profileB.name = report.profileB.name || profileB.name;
    report.profileB.dob  = report.profileB.dob  || profileB.dateOfBirth  || '';
    report.profileB.tob  = report.profileB.tob  || profileB.timeOfBirth  || '';
    report.profileB.pob  = report.profileB.pob  || profileB.birthLocation || '';

    res.json(report);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ message: 'AI returned malformed JSON. Please try again.' });
    }
    res.status(500).json({ message: err.message });
  }
};
