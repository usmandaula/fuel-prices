// __mocks__/axios.ts
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  }
};

const axiosMock = {
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn((error: any) => error?.isAxiosError === true)
};

export default axiosMock;