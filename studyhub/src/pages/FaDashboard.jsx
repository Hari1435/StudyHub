import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Image,
  Video,
  File,
  Plus,
  Search,
  MoreVertical,
  Download,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  BookOpen,
  GraduationCap,
  LogOut,
  Settings,
  Bell,
  X,
  Folder,
  Grid,
  List
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const LINKEDIN_BLUE = 'bg-[#0A66C2]';
const LINKEDIN_ACCENT = 'bg-[#004182]';
const LINKEDIN_LIGHT = 'bg-[#EAF1FB]';
const LINKEDIN_TEXT = 'text-[#0A66C2]';

const FaDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    subject: '',
    course: '',
    tags: '',
    files: []
  });
  const [materials, setMaterials] = useState([]);
  const subjects = [];
  const navigate = useNavigate();
  const location = useLocation();
  const { facultyName = 'Faculty', employeeId = 'N/A' } = location.state || {};

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FileText className="h-6 w-6" />;
      case 'image':
        return <Image className="h-6 w-6" />;
      case 'video':
        return <Video className="h-6 w-6" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'pdf':
        return 'text-[#0A66C2] bg-[#EAF1FB]';
      case 'document':
        return 'text-[#004182] bg-[#EAF1FB]';
      case 'image':
        return 'text-green-600 bg-green-100';
      case 'video':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadForm(prev => ({ ...prev, files: [...prev.files, ...files] }));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadForm(prev => ({ ...prev, files: [...prev.files, ...files] }));
    }
  };

  const removeFile = (index) => {
    setUploadForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);
    try {
      if (!uploadForm.files.length) return;
      const formData = new FormData();
      formData.append('file', uploadForm.files[0]);
      formData.append('title', uploadForm.title);
      formData.append('subject', uploadForm.subject);
      formData.append('description', uploadForm.description);
      formData.append('courseCode', uploadForm.course);
      formData.append('tags', uploadForm.tags);
      formData.append('employeeId', employeeId);

      const token = localStorage.getItem('facultyToken');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL_fact}/materials`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          },
        }
      );
      // Add to recents
      setMaterials(prev => [
        {
          name: uploadForm.files[0].name,
          uploadedAt: new Date(),
          url: res.data.material.fileUrl || '',
          title: uploadForm.title,
          subject: uploadForm.subject,
        },
        ...prev,
      ]);
      setIsUploading(false);
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: '',
        subject: '',
        course: '',
        tags: '',
        files: []
      });
      setUploadProgress(0);
    } catch (error) {
      setIsUploading(false);
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || material.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleLogout = () => {
    navigate('/authenticate');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/90 shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-[#0A66C2]" />
              <span className="ml-2 text-xl font-bold text-gray-900">Study Hub</span>
              <span className="ml-2 text-sm text-gray-500">Faculty Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-[#0A66C2] relative">
                <Bell className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-[#0A66C2]">
                <Settings className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#0A66C2] rounded-full flex items-center justify-center text-white font-semibold">
                  {facultyName.split(' ').map(w => w[0]).join('')}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{facultyName}</div>
                  <div className="text-xs text-gray-500">Employee ID: {employeeId}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/90 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-gray-500 hover:text-[#0A66C2] hover:border-[#EAF1FB]'
              }`}
            >
              Upload Materials
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'materials'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-gray-500 hover:text-[#0A66C2] hover:border-[#EAF1FB]'
              }`}
            >
              My Materials
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-gray-500 hover:text-[#0A66C2] hover:border-[#EAF1FB]'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-[#0A66C2]">Upload Study Materials</h1>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-[#0A66C2] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#004182] transition-colors inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Upload
              </button>
            </div>
            {/* Recent Uploads (empty state) */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#0A66C2] mb-4">Recent Uploads</h2>
              {materials.length === 0 ? (
                <div className="text-gray-400 text-center py-6">No recent uploads.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {materials.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-xs">{item.uploadedAt?.toLocaleString()}</span>
                        {item.url && (
                          <button
                            className="p-1 text-[#0A66C2] hover:text-[#004182]"
                            title="Download"
                            onClick={() => window.open(item.url, '_blank')}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold text-white">My Materials</h1>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#0A66C2]" />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#EAF1FB] text-[#0A66C2]' : 'text-gray-400 hover:text-[#0A66C2]'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#EAF1FB] text-[#0A66C2]' : 'text-gray-400 hover:text-[#0A66C2]'}`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            {/* Materials Grid/List (empty state) */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
              No materials found.
            </div>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
              No analytics data available.
            </div>
          </div>
        )}
      </main>
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#0A66C2]">Upload New Material</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-[#0A66C2]"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
                    placeholder="Enter material title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
                    placeholder="Enter subject name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
                  placeholder="Describe the material content..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={uploadForm.course}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, course: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
                    placeholder="e.g., CS101, MATH201"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
                    placeholder="lecture, assignment, notes"
                  />
                </div>
              </div>
              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Files *
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-[#0A66C2] bg-[#EAF1FB]'
                      : 'border-gray-300 hover:border-[#0A66C2]'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-8 w-8 text-[#0A66C2] mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="modal-file-upload"
                  />
                  <label
                    htmlFor="modal-file-upload"
                    className="bg-[#0A66C2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#004182] transition-colors cursor-pointer inline-block"
                  >
                    Choose Files
                  </label>
                </div>
                {/* Selected Files */}
                {uploadForm.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadForm.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <File className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                            <div className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="text-gray-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#0A66C2] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading || uploadForm.files.length === 0}
                >
                  {isUploading ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaDashboard;