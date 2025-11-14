import { createMocks } from 'node-mocks-http';
import morningHandler from '../morning';
import { runGithyungBot } from '@/lib/bots/githyung';

// Mock the bot module
jest.mock('@/lib/bots/githyung');

// Cast the mocked function to the correct type
const mockedRunGithyungBot = runGithyungBot as jest.Mock;

describe('/api/cron/morning API Endpoint', () => {
  process.env.CRON_SECRET = 'test-secret';

  beforeEach(() => {
    // Clear mock history before each test
    mockedRunGithyungBot.mockClear();
  });

  it('should return 401 if authorization secret is incorrect', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });

    await morningHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(mockedRunGithyungBot).not.toHaveBeenCalled();
  });

  it('should call runGithyungBot with isDryRun=true when query param is set', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-secret',
      },
      query: {
        dryRun: 'true',
      },
    });

    // Mock successful bot run
    mockedRunGithyungBot.mockResolvedValue({ success: true, dryRun: true, tweet: 'githyung' });

    await morningHandler(req, res);

    expect(mockedRunGithyungBot).toHaveBeenCalledTimes(1);
    expect(mockedRunGithyungBot).toHaveBeenCalledWith(true);

    expect(res._getStatusCode()).toBe(200);
    const results = res._getJSONData().results;
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ bot: 'githyung', success: true });
  });

  it('should handle errors from the bot function', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    const errorMessage = 'Githyung Bot Failed';
    mockedRunGithyungBot.mockRejectedValue(new Error(errorMessage));

    await morningHandler(req, res);

    expect(mockedRunGithyungBot).toHaveBeenCalledTimes(1);

    expect(res._getStatusCode()).toBe(200);
    const results = res._getJSONData().results;
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ bot: 'githyung', success: false, error: errorMessage });
  });
});
