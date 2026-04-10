import { create } from 'zustand'
import api from '../api/client'

export interface RFPListItem {
  id: string
  title: string
  client_name: string
  status: string
  department: string | null
  assigned_to: string | null
  assigned_user_name: string | null
  estimated_value: number | null
  submission_deadline: string | null
  created_at: string
}

export interface RFPFile {
  id: string
  file_type: string
  original_filename: string
  storage_path: string
  file_size_bytes: number
  mime_type: string | null
  uploaded_at: string
}

export interface AIExtraction {
  id: string
  extraction_type: string
  raw_json: any
  model_used: string | null
  tokens_used: number | null
  created_at: string
}

export interface Proposal {
  id: string
  version: number
  storage_path: string
  generation_params: any
  generated_at: string
}

export interface Comment {
  id: string
  user_id: string
  user_name: string | null
  content: string
  created_at: string
}

export interface RFPDetail extends RFPListItem {
  created_by: string
  tags: string | null
  updated_at: string
  files: RFPFile[]
  extractions: AIExtraction[]
  proposals: Proposal[]
  comments: Comment[]
}

interface RFPState {
  rfps: RFPListItem[]
  currentRFP: RFPDetail | null
  isLoading: boolean
  fetchRFPs: (params?: { status?: string; department?: string; search?: string }) => Promise<void>
  fetchRFP: (id: string) => Promise<void>
  createRFP: (data: { title: string; client_name: string; department?: string; estimated_value?: number; submission_deadline?: string }) => Promise<string>
  updateRFP: (id: string, data: any) => Promise<void>
  updateStatus: (id: string, status: string) => Promise<void>
  uploadFile: (rfpId: string, file: File, fileType: 'rfp' | 'capability') => Promise<void>
  analyzeRFP: (id: string) => Promise<void>
  matchCapability: (id: string) => Promise<void>
  generateProposal: (id: string) => Promise<void>
  addComment: (id: string, content: string) => Promise<void>
  deleteRFP: (id: string) => Promise<void>
}

export const useRFPStore = create<RFPState>((set, get) => ({
  rfps: [],
  currentRFP: null,
  isLoading: false,

  fetchRFPs: async (params) => {
    set({ isLoading: true })
    try {
      const res = await api.get('/rfps', { params })
      set({ rfps: res.data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchRFP: async (id) => {
    set({ isLoading: true })
    try {
      const res = await api.get(`/rfps/${id}`)
      set({ currentRFP: res.data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  createRFP: async (data) => {
    const res = await api.post('/rfps', data)
    return res.data.id
  },

  updateRFP: async (id, data) => {
    await api.put(`/rfps/${id}`, data)
    await get().fetchRFP(id)
  },

  updateStatus: async (id, status) => {
    await api.patch(`/rfps/${id}/status`, { status })
    await get().fetchRFP(id)
  },

  uploadFile: async (rfpId, file, fileType) => {
    const formData = new FormData()
    formData.append('file', file)
    await api.post(`/rfps/${rfpId}/upload/${fileType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await get().fetchRFP(rfpId)
  },

  analyzeRFP: async (id) => {
    await api.post(`/rfps/${id}/analyze`)
    await get().fetchRFP(id)
  },

  matchCapability: async (id) => {
    await api.post(`/rfps/${id}/match`)
    await get().fetchRFP(id)
  },

  generateProposal: async (id) => {
    await api.post(`/rfps/${id}/generate`)
    await get().fetchRFP(id)
  },

  addComment: async (id, content) => {
    await api.post(`/rfps/${id}/comments`, { content })
    await get().fetchRFP(id)
  },

  deleteRFP: async (id) => {
    await api.delete(`/rfps/${id}`)
    await get().fetchRFPs()
  },
}))
