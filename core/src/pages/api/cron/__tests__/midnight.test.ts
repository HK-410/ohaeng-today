import { createMocks } from 'node-mocks-http';
import midnightHandler from '../midnight';
import { runNanalBot } from '@/lib/bots/nanal';
import { runWeatherfairyBot } from '@/lib/bots/weatherfairy';

// Mock the bot modules
jest.mock('@/lib/bots/nanal');
jest.mock('@/lib/bots/weatherfairy');

// Cast the mocked functions to the correct type
const mockedRunNanalBot = runNanalBot as jest.Mock;
const mockedRunWeatherfairyBot = runWeatherfairyBot as jest.Mock;

describe('/api/cron/midnight API Endpoint', () => {
  process.env.CRON_SECRET = 'test-secret';

  beforeEach(() => {
    // Clear mock history before each test
    mockedRunNanalBot.mockClear();
    mockedRunWeatherfairyBot.mockClear();
  });

  it('should return 401 if authorization secret is incorrect', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });

    await midnightHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(mockedRunNanalBot).not.toHaveBeenCalled();
    expect(mockedRunWeatherfairyBot).not.toHaveBeenCalled();
  });

  it('should call both bots with isDryRun=true when query param is set', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-secret',
      },
      query: {
        dryRun: 'true',
      },
    });

    // Mock successful bot runs
    mockedRunWeatherfairyBot.mockResolvedValue({ success: true, dryRun: true });
    mockedRunNanalBot.mockResolvedValue({ success: true, dryRun: true });

    await midnightHandler(req, res);

    expect(mockedRunWeatherfairyBot).toHaveBeenCalledTimes(1);
    expect(mockedRunWeatherfairyBot).toHaveBeenCalledWith(true);
    expect(mockedRunNanalBot).toHaveBeenCalledTimes(1);
    expect(mockedRunNanalBot).toHaveBeenCalledWith(true);

    expect(res._getStatusCode()).toBe(200);
    const results = res._getJSONData().results;
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ bot: 'weatherfairy', success: true });
    expect(results[1]).toMatchObject({ bot: 'nanal', success: true });
  });

  it('should continue running other bots if one fails', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    const errorMessage = 'Nanal Bot Failed';
    mockedRunWeatherfairyBot.mockResolvedValue({ success: true, dryRun: false });
    mockedRunNanalBot.mockRejectedValue(new Error(errorMessage));

    await midnightHandler(req, res);

    expect(mockedRunWeatherfairyBot).toHaveBeenCalledTimes(1);
    expect(mockedRunNanalBot).toHaveBeenCalledTimes(1);

    expect(res._getStatusCode()).toBe(200);
    const results = res._getJSONData().results;
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ bot: 'weatherfairy', success: true });
    expect(results[1]).toMatchObject({ bot: 'nanal', success: false, error: errorMessage });
  });
});
