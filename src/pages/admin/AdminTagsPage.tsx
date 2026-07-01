import { useEffect, useState } from 'react';
import Container from '@/components/Layout/Container';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';
import { adminApi } from '@/apis/admin.api';
import { tagApi } from '@/apis/tag.api';
import type { TagResponse } from '@/types/common.types';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import ConfirmModal from '@/components/Modal/ConfirmModal';

const AdminTagsPage = () => {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tag: TagResponse | null }>({
    isOpen: false,
    tag: null
  });

  const fetchTags = async () => {
    setLoading(true);
    try {
      const data = await tagApi.getAllTags();
      setTags(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to fetch tags');
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    setSaving(true);
    try {
      const created = await adminApi.createTag({ name: name.trim(), slug: slug.trim() });
      toast.success('Tag created successfully');
      setName(''); setSlug('');
      await fetchTags();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Failed to create tag');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (tag: TagResponse) => {
    const newName = window.prompt('New name', tag.name);
    if (newName == null) return;
    const newSlug = window.prompt('New slug', tag.slug || '');
    if (newSlug == null) return;
    try {
      await adminApi.updateTag(tag.id, { name: newName.trim(), slug: newSlug.trim() });
      toast.success('Updated successfully');
      await fetchTags();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteClick = (tag: TagResponse) => {
    setDeleteModal({ isOpen: true, tag });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.tag) return;
    
    try {
      await adminApi.deleteTag(deleteModal.tag.id);
      toast.success('Deleted successfully');
      setTags((s) => s.filter(t => t.id !== deleteModal.tag!.id));
      setDeleteModal({ isOpen: false, tag: null });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Delete failed');
      await fetchTags();
      setDeleteModal({ isOpen: false, tag: null });
    }
  };

  if (loading) return <Container><div className="py-12"><Loading /></div></Container>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-blue-600">Manage Tags</h1>
          </div>

          <div className="p-6 space-y-6">
            {/* Create Form */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Create New Tag</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dynamic Programming"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. dynamic-programming"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Tag'}
              </button>
            </div>

            {/* List Table */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Tags List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tags.map(tag => (
                      <tr key={tag.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600">{tag.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{tag.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{tag.slug}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(tag)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(tag)}
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
      {deleteModal.isOpen && deleteModal.tag && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, tag: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Tag"
          message={`Are you sure you want to delete "${deleteModal.tag.name}"? This action is permanent and cannot be undone.`}
          confirmButtonText="Delete"
          confirmButtonColor="red"
        />
      )}
    </div>
  );
};

export default AdminTagsPage;
