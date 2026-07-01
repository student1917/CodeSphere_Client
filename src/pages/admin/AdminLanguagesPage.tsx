import { useEffect, useState } from 'react';
import { adminApi } from '@/apis/admin.api';
import Container from '@/components/Layout/Container';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import ConfirmModal from '@/components/Modal/ConfirmModal';

const AdminLanguagesPage = () => {
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [version, setVersion] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; language: any | null }>({
    isOpen: false,
    language: null
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1','') || ''}/api/v1/languages`);
        const data = await res.json();
        setLanguages(data.data || []);
      } catch (e) {
        console.error(e);
        setLanguages([]);
        toast.error('Failed to load languages');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      const created = await adminApi.createLanguage({ code: code.trim(), name: name.trim(), version: version.trim() });
      setLanguages((s) => [created, ...s]);
      setName(''); setCode(''); setVersion('');
      toast.success('Language created successfully');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (lang: any) => {
    const newName = window.prompt('New name', lang.name);
    if (newName == null) return;
    const newVersion = window.prompt('New version', lang.version || '');
    if (newVersion == null) return;

    try {
      const updated = await adminApi.updateLanguage(lang.id, { name: newName.trim(), version: newVersion.trim() });
      setLanguages((s) => s.map((l:any) => (l.id === updated.id ? updated : l)));
      toast.success('Updated successfully');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteClick = (lang: any) => {
    setDeleteModal({ isOpen: true, language: lang });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.language) return;
    
    try {
      await adminApi.deleteLanguage(deleteModal.language.id);
      setLanguages((s) => s.filter(l => l.id !== deleteModal.language!.id));
      toast.success('Deleted successfully');
      setDeleteModal({ isOpen: false, language: null });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Delete failed');
      setDeleteModal({ isOpen: false, language: null });
    }
  };

  if (loading) return <Container><div className="py-12"><Loading /></div></Container>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-blue-600">Manage Languages</h1>
          </div>

          <div className="p-6 space-y-6">
            {/* Create Form */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Create New Language</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. python"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Python"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Version</label>
                  <input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. 3.11"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Language'}
              </button>
            </div>

            {/* List Table */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Languages List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Version</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {languages.map((l:any) => (
                      <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600">{l.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{l.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{l.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{l.version || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(l)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(l)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.language && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, language: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Language"
          message={`Are you sure you want to delete "${deleteModal.language.name}"? This action is permanent and cannot be undone.`}
          confirmButtonText="Delete"
          confirmButtonColor="red"
        />
      )}
    </div>
  );
};

export default AdminLanguagesPage;
