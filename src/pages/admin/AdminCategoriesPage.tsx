import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Container from '@/components/Layout/Container';
import Loading from '@/components/Loading';
import { categoryApi } from '@/apis/category.api';
import { adminApi } from '@/apis/admin.api';
import type { CategoryResponse } from '@/types/common.types';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import ConfirmModal from '@/components/Modal/ConfirmModal';
import EditCategoryModal from '@/components/Modal/EditCategoryModal';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; category: CategoryResponse | null }>({
    isOpen: false,
    category: null
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; category: CategoryResponse | null }>({
    isOpen: false,
    category: null
  });
  const [updating, setUpdating] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryApi.getAllCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setCategories([]);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const created = await adminApi.createCategory({ name: name.trim() });
      toast.success('Category created successfully');
      await fetchCategories();
      setName('');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (cat: CategoryResponse) => {
    setEditModal({ isOpen: true, category: cat });
  };

  const handleEditConfirm = async (newName: string) => {
    if (!editModal.category) return;
    
    setUpdating(true);
    try {
      const updated = await adminApi.updateCategory(editModal.category.id, { name: newName });
      toast.success('Updated successfully');
      await fetchCategories();
      setEditModal({ isOpen: false, category: null });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (cat: CategoryResponse) => {
    setDeleteModal({ isOpen: true, category: cat });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.category) return;
    
    try {
      await adminApi.deleteCategory(deleteModal.category.id);
      toast.success('Deleted successfully');
      setCategories((s) => s.filter(c => c.id !== deleteModal.category!.id));
      setDeleteModal({ isOpen: false, category: null });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Delete failed');
      setDeleteModal({ isOpen: false, category: null });
    }
  };

  if (loading) return <Container><div className="py-12"><Loading /></div></Container>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-blue-600">Manage Categories</h1>
          </div>

          <div className="p-6 space-y-6">
            {/* Create Form */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Create New Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Algorithms"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Slug will be automatically generated from the name</p>
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Category'}
              </button>
            </div>

            {/* List Table */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Categories List</h3>
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
                    {categories.map(cat => (
                      <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600">{cat.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{cat.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{cat.slug}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(cat)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(cat)}
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

      {/* Edit Modal */}
      {editModal.isOpen && editModal.category && (
        <EditCategoryModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, category: null })}
          onConfirm={handleEditConfirm}
          currentName={editModal.category.name}
          title="Edit Category"
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.category && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, category: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Category"
          message={`Are you sure you want to delete "${deleteModal.category.name}"? If this category is being used by problems or has sub-categories, the deletion will be blocked. This action is permanent and cannot be undone.`}
          confirmButtonText="Delete"
          confirmButtonColor="red"
        />
      )}
    </div>
  );
};

export default AdminCategoriesPage;
