import { mainApi } from './axiosInstance';

export const authApi = {
  companySignup: (data) => mainApi.post('/auth/company-signup', data),
  login: (data) => mainApi.post('/auth/login', data),
  me: () => mainApi.get('/auth/me'),
  getUsers: () => mainApi.get('/auth/users'),
  createUser: (data) => mainApi.post('/auth/users', data),
  changeRole: (userId, role) => mainApi.patch(`/auth/users/${userId}/role`, { role }),
  assignManager: (userId, managerId) => mainApi.patch(`/auth/users/${userId}/manager`, { managerId }),
};

export const expenseApi = {
  create: (data) => mainApi.post('/expenses', data),
  getMyExpenses: () => mainApi.get('/expenses'),
};

export const approvalApi = {
  getRules: () => mainApi.get('/approvals/rules'),
  setRules: (data) => mainApi.put('/approvals/rules', data),
  getPending: () => mainApi.get('/approvals'),
  decide: (expenseId, decision, comments) =>
    mainApi.post(`/approvals/${expenseId}/approve`, { decision, comments }),
};
