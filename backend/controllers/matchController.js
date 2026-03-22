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
You will be given two horoscope chart images (patrika / janampatri / kundali). The charts may be in Marathi, Hindi, Sanskrit, or English.

For EACH chart, carefully extract:
- Name (if printed on chart)
- Date of Birth, Time of Birth, Place of Birth (if visible)
- Rashi (Moon Sign / Chandra Rashi)
- Nakshatra (birth star) and Pada (quarter)
- Lagna (Ascendant / Rising sign)
- Positions of all 9 Grahas (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) in their respective houses

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
              type: 'image',
              source: {
                type: 'base64',
                media_type: detectMimeType(profileA.patrikaImage.key),
                data: bufA.toString('base64'),
              },
            },
            {
              type: 'text',
              text: `This is the patrika (horoscope chart) of ${profileA.name} (Profile A).`,
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
              text: `This is the patrika (horoscope chart) of ${profileB.name} (Profile B). Now analyze both charts and return the full compatibility report as JSON.\n\nIMPORTANT: Write all narrative text fields — the "summary" field and every "details" value inside "ashtakoot" and "mangal_dosha" — in ${languageName}. All JSON field names and keys must remain in English.`,
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

    // Attach profile metadata
    report.profileA.name = report.profileA.name || profileA.name;
    report.profileB.name = report.profileB.name || profileB.name;

    res.json(report);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ message: 'AI returned malformed JSON. Please try again.' });
    }
    res.status(500).json({ message: err.message });
  }
};
