import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ExternalLink, Book, Phone, Video, FileText, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Resource {
  id: string
  title: string
  description: string
  category: 'mental_health' | 'physical_health' | 'academic' | 'emergency' | 'other'
  resource_type: 'link' | 'phone' | 'document' | 'video'
  url?: string
  phone_number?: string
  is_emergency: boolean
  created_at: string
}

export default function ResourceManagement() {
  const [resources, setResources] = useState<Resource[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'mental_health' as Resource['category'],
    resource_type: 'link' as Resource['resource_type'],
    url: '',
    phone_number: '',
    is_emergency: false
  })

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('is_emergency', { ascending: false })
        .order('category')
        .order('title')

      if (error) throw error
      setResources(data || [])
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update(formData)
          .eq('id', editingResource.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('resources')
          .insert([formData])

        if (error) throw error
      }

      resetForm()
      fetchResources()
    } catch (error) {
      console.error('Error saving resource:', error)
      alert('Failed to save resource')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchResources()
    } catch (error) {
      console.error('Error deleting resource:', error)
      alert('Failed to delete resource')
    }
  }

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      resource_type: resource.resource_type,
      url: resource.url || '',
      phone_number: resource.phone_number || '',
      is_emergency: resource.is_emergency
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'mental_health',
      resource_type: 'link',
      url: '',
      phone_number: '',
      is_emergency: false
    })
    setEditingResource(null)
    setShowAddForm(false)
  }

  const getResourceIcon = (type: Resource['resource_type']) => {
    switch (type) {
      case 'link': return <ExternalLink className="w-5 h-5" />
      case 'phone': return <Phone className="w-5 h-5" />
      case 'video': return <Video className="w-5 h-5" />
      case 'document': return <FileText className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: Resource['category']) => {
    switch (category) {
      case 'mental_health': return 'bg-blue-100 text-blue-800'
      case 'physical_health': return 'bg-green-100 text-green-800'
      case 'academic': return 'bg-purple-100 text-purple-800'
      case 'emergency': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading resources...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Management</h2>
          <p className="text-gray-600">Manage support resources for students</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingResource ? 'Edit Resource' : 'Add New Resource'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Resource['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mental_health">Mental Health</option>
                  <option value="physical_health">Physical Health</option>
                  <option value="academic">Academic</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.resource_type}
                  onChange={(e) => setFormData({ ...formData, resource_type: e.target.value as Resource['resource_type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="link">Link</option>
                  <option value="phone">Phone</option>
                  <option value="document">Document</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>

            {(formData.resource_type === 'link' || formData.resource_type === 'video' || formData.resource_type === 'document') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {formData.resource_type === 'phone' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_emergency"
                checked={formData.is_emergency}
                onChange={(e) => setFormData({ ...formData, is_emergency: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_emergency" className="text-sm font-medium text-gray-700">
                Emergency Resource
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                {editingResource ? 'Update' : 'Create'} Resource
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-blue-900 mt-1">
                  {resource.is_emergency && <AlertCircle className="w-5 h-5 text-red-600" />}
                  {!resource.is_emergency && getResourceIcon(resource.resource_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(resource.category)}`}>
                      {resource.category.replace('_', ' ')}
                    </span>
                    {resource.is_emergency && (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {resource.url}
                    </a>
                  )}
                  {resource.phone_number && (
                    <a
                      href={`tel:${resource.phone_number}`}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      {resource.phone_number}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(resource)}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {resources.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Book className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No resources added yet</p>
            <p className="text-sm">Click "Add Resource" to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
