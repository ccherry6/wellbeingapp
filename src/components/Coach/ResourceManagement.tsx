import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ExternalLink, Book, Phone, Video, FileText, AlertCircle, Zap, ToggleLeft, ToggleRight, X, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface TriggerCondition {
  metric_name: string
  condition: string
  value: number
}

interface Resource {
  id: string
  title: string
  description: string
  category: 'mental_health' | 'physical_health' | 'academic' | 'emergency' | 'other'
  resource_type: 'link' | 'phone' | 'document' | 'video'
  url?: string
  phone_number?: string
  is_emergency: boolean
  triggers?: TriggerCondition[]
  trigger_logic?: 'any' | 'all'
  auto_deploy?: boolean
  trigger_enabled?: boolean
  send_email?: boolean
  email_subject?: string
  email_message?: string
  created_at: string
}

const metricOptions = [
  { value: 'sleep_quality', label: 'Sleep Quality' },
  { value: 'sleep_hours', label: 'Sleep Hours' },
  { value: 'energy_level', label: 'Energy Level' },
  { value: 'training_fatigue', label: 'Training Fatigue' },
  { value: 'muscle_soreness', label: 'Muscle Soreness' },
  { value: 'mood', label: 'Mood' },
  { value: 'stress_level', label: 'Stress Level' },
  { value: 'academic_pressure', label: 'Academic Pressure' },
  { value: 'relationship_satisfaction', label: 'Relationship Satisfaction' },
  { value: 'program_belonging', label: 'Program Belonging' },
  { value: 'hrv', label: 'Heart Rate Variability (HRV)' },
  { value: 'resting_heart_rate', label: 'Resting Heart Rate' }
]

const conditionOptions = [
  { value: 'less_than', label: 'Less than (<)' },
  { value: 'less_than_or_equal', label: 'Less than or equal (≤)' },
  { value: 'greater_than', label: 'Greater than (>)' },
  { value: 'greater_than_or_equal', label: 'Greater than or equal (≥)' },
  { value: 'equals', label: 'Equals (=)' }
]

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
    is_emergency: false,
    triggers: [] as TriggerCondition[],
    trigger_logic: 'any' as 'any' | 'all',
    auto_deploy: false,
    trigger_enabled: false,
    send_email: false,
    email_subject: '',
    email_message: ''
  })

  const [newTrigger, setNewTrigger] = useState<TriggerCondition>({
    metric_name: '',
    condition: '',
    value: 0
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
        .order('trigger_enabled', { ascending: false })
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

  const addTriggerToForm = () => {
    if (!newTrigger.metric_name || !newTrigger.condition || newTrigger.value === undefined) {
      alert('Please fill in all trigger fields')
      return
    }

    setFormData({
      ...formData,
      triggers: [...formData.triggers, newTrigger]
    })

    setNewTrigger({
      metric_name: '',
      condition: '',
      value: 0
    })
  }

  const removeTriggerFromForm = (index: number) => {
    setFormData({
      ...formData,
      triggers: formData.triggers.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.trigger_enabled && formData.triggers.length === 0) {
      alert('Please add at least one trigger condition')
      return
    }

    try {
      const resourceData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        resource_type: formData.resource_type,
        url: formData.url || null,
        phone_number: formData.phone_number || null,
        is_emergency: formData.is_emergency,
        triggers: formData.trigger_enabled ? formData.triggers : [],
        trigger_logic: formData.trigger_enabled ? formData.trigger_logic : 'any',
        auto_deploy: formData.trigger_enabled ? formData.auto_deploy : false,
        trigger_enabled: formData.trigger_enabled,
        send_email: formData.trigger_enabled ? formData.send_email : false,
        email_subject: formData.trigger_enabled && formData.send_email ? formData.email_subject : null,
        email_message: formData.trigger_enabled && formData.send_email ? formData.email_message : null
      }

      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingResource.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('resources')
          .insert([resourceData])

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
      is_emergency: resource.is_emergency,
      triggers: resource.triggers || [],
      trigger_logic: resource.trigger_logic || 'any',
      auto_deploy: resource.auto_deploy || false,
      trigger_enabled: resource.trigger_enabled || false,
      send_email: resource.send_email || false,
      email_subject: resource.email_subject || '',
      email_message: resource.email_message || ''
    })
    setShowAddForm(true)
  }

  const toggleTrigger = async (resourceId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ trigger_enabled: !currentState })
        .eq('id', resourceId)

      if (error) throw error
      fetchResources()
    } catch (error) {
      console.error('Error toggling trigger:', error)
      alert('Failed to toggle trigger')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'mental_health',
      resource_type: 'link',
      url: '',
      phone_number: '',
      is_emergency: false,
      triggers: [],
      trigger_logic: 'any',
      auto_deploy: false,
      trigger_enabled: false,
      send_email: false,
      email_subject: '',
      email_message: ''
    })
    setNewTrigger({
      metric_name: '',
      condition: '',
      value: 0
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

  const getTriggerDescription = (resource: Resource) => {
    if (!resource.triggers || resource.triggers.length === 0) {
      return 'No triggers configured'
    }

    const descriptions = resource.triggers.map(trigger => {
      const metric = metricOptions.find(m => m.value === trigger.metric_name)?.label || trigger.metric_name
      const condition = conditionOptions.find(c => c.value === trigger.condition)?.label || trigger.condition
      return `${metric} ${condition} ${trigger.value}`
    })

    const logic = resource.trigger_logic === 'all' ? ' AND ' : ' OR '
    return `Deploy when: ${descriptions.join(logic)}`
  }

  if (loading) {
    return <div className="text-center py-8">Loading resources...</div>
  }

  const resourcesWithTriggers = resources.filter(r => r.trigger_enabled)
  const resourcesWithoutTriggers = resources.filter(r => !r.trigger_enabled)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Management</h2>
          <p className="text-gray-600">Manage support resources and auto-deployment triggers</p>
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

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="trigger_enabled"
                  checked={formData.trigger_enabled}
                  onChange={(e) => setFormData({ ...formData, trigger_enabled: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="trigger_enabled" className="text-sm font-medium text-gray-700 flex items-center">
                  <Zap className="w-4 h-4 mr-1 text-yellow-600" />
                  Enable Auto-Deploy Trigger
                </label>
              </div>

              {formData.trigger_enabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                  <p className="text-sm text-gray-700 mb-3">
                    This resource will be automatically deployed to students when their wellbeing metrics meet the trigger conditions.
                  </p>

                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-gray-900 mb-2">Add Trigger Conditions</h4>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Metric</label>
                        <select
                          value={newTrigger.metric_name}
                          onChange={(e) => setNewTrigger({ ...newTrigger, metric_name: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          {metricOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
                        <select
                          value={newTrigger.condition}
                          onChange={(e) => setNewTrigger({ ...newTrigger, condition: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          {conditionOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          step="0.1"
                          value={newTrigger.value}
                          onChange={(e) => setNewTrigger({ ...newTrigger, value: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={addTriggerToForm}
                          className="w-full px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          <Plus className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>

                    {formData.triggers.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-gray-900">Active Triggers ({formData.triggers.length})</h5>
                          {formData.triggers.length > 1 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Match:</span>
                              <select
                                value={formData.trigger_logic}
                                onChange={(e) => setFormData({ ...formData, trigger_logic: e.target.value as 'any' | 'all' })}
                                className="text-xs px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="any">Any (OR)</option>
                                <option value="all">All (AND)</option>
                              </select>
                            </div>
                          )}
                        </div>
                        {formData.triggers.map((trigger, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                            <span className="text-sm text-gray-700">
                              {metricOptions.find(m => m.value === trigger.metric_name)?.label}{' '}
                              {conditionOptions.find(c => c.value === trigger.condition)?.label}{' '}
                              {trigger.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeTriggerFromForm(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto_deploy"
                      checked={formData.auto_deploy}
                      onChange={(e) => setFormData({ ...formData, auto_deploy: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="auto_deploy" className="text-sm text-gray-700">
                      Automatically show this resource to students (visible in their dashboard)
                    </label>
                  </div>

                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="send_email"
                        checked={formData.send_email}
                        onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="send_email" className="text-sm font-medium text-gray-700 flex items-center">
                        <Mail className="w-4 h-4 mr-1 text-blue-600" />
                        Send Email Notification to Student
                      </label>
                    </div>

                    {formData.send_email && (
                      <div className="space-y-3 ml-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                          <input
                            type="text"
                            value={formData.email_subject}
                            onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                            placeholder="Support Resource Available"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required={formData.send_email}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Message</label>
                          <textarea
                            value={formData.email_message}
                            onChange={(e) => setFormData({ ...formData, email_message: e.target.value })}
                            placeholder="We noticed you might benefit from this resource..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            required={formData.send_email}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

      {resourcesWithTriggers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-600" />
            Resources with Auto-Deploy Triggers ({resourcesWithTriggers.length})
          </h3>
          <div className="grid gap-4">
            {resourcesWithTriggers.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-lg shadow-sm border-2 border-yellow-200 p-4 hover:shadow-md transition-shadow"
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
                        {resource.send_email && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
                      <div className="flex items-start space-x-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium text-yellow-800">
                          {getTriggerDescription(resource)}
                        </span>
                      </div>
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
                      onClick={() => toggleTrigger(resource.id, resource.trigger_enabled || false)}
                      className="text-yellow-600 hover:text-yellow-800 transition-colors"
                      title="Disable trigger"
                    >
                      <ToggleRight className="w-5 h-5" />
                    </button>
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
          </div>
        </div>
      )}

      {resourcesWithoutTriggers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            All Resources ({resourcesWithoutTriggers.length})
          </h3>
          <div className="grid gap-4">
            {resourcesWithoutTriggers.map((resource) => (
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
          </div>
        </div>
      )}

      {resources.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Book className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No resources added yet</p>
          <p className="text-sm">Click "Add Resource" to get started</p>
        </div>
      )}
    </div>
  )
}
