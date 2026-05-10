const path = require('path');

// 微信开发者工具 CLI 路径 (macOS)
const CLI_PATH = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';

// 项目路径
const PROJECT_PATH = path.resolve(__dirname, '../../');

// 自动化连接配置
const AUTOMATOR_CONFIG = {
  cliPath: CLI_PATH,
  projectPath: PROJECT_PATH,
  timeout: 30000,
};

// 页面路由
const PAGES = {
  INDEX: '/pages/index/index',
  TRIP: '/pages/trip/index',
  TREASURE: '/pages/treasure/index',
  MINE: '/pages/mine/index',
  LOGIN: '/pages/login/index',
  SURVEY: '/pages/survey/index',
  PROFILE_EDIT: '/pages/profile-edit/index',
  JOURNEYS: '/pages/journeys/index',
  CREATE_ITINERARY: '/pages/create-itinerary/index',
  ITINERARY_DETAIL: '/pages/itinerary-detail/index',
};

// TabBar 页面
const TAB_PAGES = [PAGES.INDEX, PAGES.TREASURE, PAGES.MINE];

// 测试超时配置
const TIMEOUTS = {
  PAGE_LOAD: 5000,
  ANIMATION: 1000,
  NETWORK: 10000,
  TAP_DELAY: 300,
};

// Mock 数据
const MOCK_USER = {
  token: 'mock_token_for_testing_12345',
  nickname: '测试用户',
  avatarUrl: '/assets/images/user-profile.png',
};

module.exports = {
  CLI_PATH,
  PROJECT_PATH,
  AUTOMATOR_CONFIG,
  PAGES,
  TAB_PAGES,
  TIMEOUTS,
  MOCK_USER,
};
