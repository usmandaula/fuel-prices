const mockAxiosInstance = {
  get: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn()
    }
  }
};

const axiosMock = {
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn()
};

export default axiosMock;
export { mockAxiosInstance };
