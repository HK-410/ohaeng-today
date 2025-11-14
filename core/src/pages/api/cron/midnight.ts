import type { NextApiRequest, NextApiResponse } from 'next';
import { runNanalBot } from '@/lib/bots/nanal';
import { runWeatherfairyBot } from '@/lib/bots/weatherfairy';

const BOTS_TO_RUN = [
  { name: 'weatherfairy', func: runWeatherfairyBot },
  { name: 'nanal', func: runNanalBot },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.headers['authorization']?.split(' ')[1] !== process.env.CRON_SECRET) {
    return res.status(401).send('Unauthorized');
  }
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const isDryRun = req.query.dryRun === 'true';
  const results = [];

  for (const bot of BOTS_TO_RUN) {
    try {
      console.log(`[API_CRON_MIDNIGHT] Running ${bot.name} bot...`);
      const result = await bot.func(isDryRun);
      results.push({ bot: bot.name, ...result });
      console.log(`[API_CRON_MIDNIGHT] Finished ${bot.name} bot.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error(`[API_CRON_MIDNIGHT] Error executing ${bot.name} bot:`, errorMessage);
      results.push({ bot: bot.name, success: false, error: errorMessage });
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Midnight job execution completed.',
    results,
  });
}
