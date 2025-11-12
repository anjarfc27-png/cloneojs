/**
 * Navigation Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, Edit, Trash2, MoveUp, MoveDown, ChevronRight, ChevronDown } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PageHeader from '@/components/shared/PageHeader'
import { getNavigationMenus, NavigationMenuWithRelations } from '@/actions/navigation/get'
import { createNavigationMenu } from '@/actions/navigation/create'
import { updateNavigationMenu } from '@/actions/navigation/update'
import { deleteNavigationMenu } from '@/actions/navigation/delete'

interface NavigationMenu {
  id: string
  name: string
  title: string
  url?: string
  menu_type: string
  parent_id?: string
  sequence: number
  enabled: boolean
  target_blank: boolean
  created_at: string
  updated_at: string
  children?: NavigationMenu[]
}

export default function NavigationPage() {
  const [menus, setMenus] = useState<NavigationMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<NavigationMenu | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getNavigationMenus()

      if (!result.success) {
        setError(result.error || 'Failed to fetch navigation menus')
        return
      }

      if (result.data) {
        // Transform NavigationMenuWithRelations to NavigationMenu format
        const transformMenu = (menu: NavigationMenuWithRelations): NavigationMenu => ({
          id: menu.id,
          name: menu.name,
          title: menu.title,
          url: menu.url || undefined,
          menu_type: menu.menu_type,
          parent_id: menu.parent_id || undefined,
          sequence: menu.sequence,
          enabled: menu.enabled,
          target_blank: menu.target_blank,
          created_at: menu.created_at,
          updated_at: menu.updated_at,
          children: menu.children?.map(transformMenu),
        })

        const transformedMenus = result.data.tree.map(transformMenu)
        setMenus(transformedMenus)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch navigation menus')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMenu(null)
    setIsModalOpen(true)
  }

  const handleEdit = (menu: NavigationMenu) => {
    setEditingMenu(menu)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteNavigationMenu({ id })

        if (!result.success) {
          setError(result.error || 'Failed to delete menu item')
          return
        }

        await fetchMenus()
      } catch (err: any) {
        setError(err.message || 'Failed to delete menu item')
      }
    })
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const menu = findMenuById(menus, id)
    if (!menu) return

    const newSequence = direction === 'up' ? menu.sequence - 1 : menu.sequence + 1

    startTransition(async () => {
      try {
        const result = await updateNavigationMenu({
          id,
          sequence: newSequence,
        })

        if (!result.success) {
          setError(result.error || 'Failed to move menu item')
          return
        }

        await fetchMenus()
      } catch (err: any) {
        setError(err.message || 'Failed to move menu item')
      }
    })
  }

  const findMenuById = (menuList: NavigationMenu[], id: string): NavigationMenu | null => {
    for (const menu of menuList) {
      if (menu.id === id) return menu
      if (menu.children) {
        const found = findMenuById(menu.children, id)
        if (found) return found
      }
    }
    return null
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedMenus(newExpanded)
  }

  const renderMenuTree = (menuList: NavigationMenu[], level: number = 0) => {
    return menuList.map((menu) => {
      const hasChildren = menu.children && menu.children.length > 0
      const isExpanded = expandedMenus.has(menu.id)

      return (
        <div key={menu.id} className={`${level > 0 ? 'ml-8 mt-2' : ''}`}>
          <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50">
            <div className="flex items-center flex-1">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(menu.id)}
                  className="mr-2 p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-6 mr-2" />
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-900">{menu.title}</div>
                <div className="text-sm text-gray-500">
                  {menu.url && (
                    <span className="mr-2">URL: {menu.url}</span>
                  )}
                  <span className="mr-2">Type: {menu.menu_type}</span>
                  <span className={`px-2 py-1 rounded text-xs ${menu.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {menu.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleMove(menu.id, 'up')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                title="Move up"
              >
                <MoveUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMove(menu.id, 'down')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                title="Move down"
              >
                <MoveDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEdit(menu)}
                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(menu.id)}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="mt-2">
              {renderMenuTree(menu.children!, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  if (loading || isPending) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Navigation Menus"
          description="Manage site navigation menus"
        />
        <ContentCard>
          <LoadingSpinner message="Loading navigation menus..." />
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Navigation Menus"
        description="Manage site navigation menus"
      />

      {error && <ErrorAlert message={error} />}

      <ContentCard>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Menu Items</h2>
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#004494] transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </button>
        </div>

        {menus.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No navigation menus found. Click "Add Menu Item" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {renderMenuTree(menus)}
          </div>
        )}
      </ContentCard>

      {isModalOpen && (
        <NavigationMenuModal
          menu={editingMenu}
          onClose={() => {
            setIsModalOpen(false)
            setEditingMenu(null)
          }}
          onSuccess={() => {
            setIsModalOpen(false)
            setEditingMenu(null)
            fetchMenus()
          }}
          menus={menus}
        />
      )}
    </div>
  )
}

interface NavigationMenuModalProps {
  menu: NavigationMenu | null
  onClose: () => void
  onSuccess: () => void
  menus: NavigationMenu[]
}

function NavigationMenuModal({ menu, onClose, onSuccess, menus }: NavigationMenuModalProps) {
  const [formData, setFormData] = useState({
    name: menu?.name || '',
    title: menu?.title || '',
    url: menu?.url || '',
    menu_type: (menu?.menu_type || 'custom') as 'custom' | 'journal' | 'article' | 'issue',
    parent_id: menu?.parent_id || '',
    sequence: menu?.sequence || 0,
    enabled: menu?.enabled !== undefined ? menu.enabled : true,
    target_blank: menu?.target_blank || false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    startTransition(async () => {
      try {
        const payload: any = {
          name: formData.name,
          title: formData.title,
          url: formData.url || null,
          menu_type: formData.menu_type,
          parent_id: formData.parent_id || null,
          sequence: formData.sequence,
          enabled: formData.enabled,
          target_blank: formData.target_blank,
        }

        if (menu) {
          payload.id = menu.id
          const result = await updateNavigationMenu(payload)

          if (!result.success) {
            setError(result.error || 'Failed to update menu item')
            if (result.details) {
              console.error('Validation errors:', result.details)
            }
            setSaving(false)
            return
          }
        } else {
          const result = await createNavigationMenu(payload)

          if (!result.success) {
            setError(result.error || 'Failed to create menu item')
            if (result.details) {
              console.error('Validation errors:', result.details)
            }
            setSaving(false)
            return
          }
        }

        onSuccess()
      } catch (err: any) {
        setError(err.message || 'Failed to save menu item')
      } finally {
        setSaving(false)
      }
    })
  }

  const flattenMenus = (menuList: NavigationMenu[], level: number = 0): NavigationMenu[] => {
    const result: NavigationMenu[] = []
    menuList.forEach(menu => {
      result.push(menu)
      if (menu.children) {
        result.push(...flattenMenus(menu.children, level + 1))
      }
    })
    return result
  }

  const availableParents = flattenMenus(menus).filter(m => m.id !== menu?.id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {menu ? 'Edit Menu Item' : 'Create Menu Item'}
        </h2>

        {error && <ErrorAlert message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
              placeholder="menu-item-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
              placeholder="Menu Item Title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
              placeholder="/page-url"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Menu Type
              </label>
              <select
                value={formData.menu_type}
                onChange={(e) => setFormData({ ...formData, menu_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
              >
                <option value="custom">Custom</option>
                <option value="journal">Journal</option>
                <option value="article">Article</option>
                <option value="issue">Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Menu
              </label>
              <select
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
              >
                <option value="">None (Root)</option>
                {availableParents.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sequence
            </label>
            <input
              type="number"
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.target_blank}
                onChange={(e) => setFormData({ ...formData, target_blank: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Open in new tab</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isPending}
              className="px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#004494] disabled:opacity-50"
            >
              {saving || isPending ? 'Saving...' : menu ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


