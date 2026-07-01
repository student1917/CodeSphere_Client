import apiClient from './apiClient';

export const languageApi = {
  getAllLanguages: async () => {
    const res = await apiClient.get('/languages');
    return res.data?.data ?? res.data ?? [];
  },

  getLanguage: async (id: number) => {
    const res = await apiClient.get(`/languages/${id}`);
    return res.data?.data ?? res.data;
  },
};

export default languageApi;