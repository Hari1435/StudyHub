import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  BookOpen, 
  Calendar, 
  User, 
  FileText, 
  Image, 
  Video, 
  File, 
  GraduationCap,
  LogOut,
  Settings,
  Bell,
  Grid,
  List,
  Star,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Share2,
  Heart,
  MessageCircle
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StuDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // State for materials and faculty search
  const [materials, setMaterials] = useState([]);
  const [facultyIdInput, setFacultyIdInput] = useState('');
  const [searchedFacultyId, setSearchedFacultyId] = useState('');

  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Add a new state for search input and search trigger
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAllMaterials = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL_fact}/all-materials`);
        setMaterials((res.data.materials || []).filter(m => m.fileUrl));
      } catch (error) {
        setMaterials([]);
      }
    };
    fetchAllMaterials();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update handleFacultySearch to filter by employeeId
  const handleFacultySearch = async () => {
    if (!facultyIdInput) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/materials-by-faculty?employeeId=${facultyIdInput}`
      );
      setMaterials((response.data.materials || []).filter(m => m.fileUrl));
      setSearchedFacultyId(facultyIdInput);
      setSearchInput('');
      setSearchQuery('');
    } catch (error) {
      setMaterials([]);
      setSearchedFacultyId(facultyIdInput);
      setSearchInput('');
      setSearchQuery('');
      console.error('Error fetching materials:', error);
    }
  };

  const subjects = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering'];
  const fileTypes = [
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'document', label: 'Presentations' },
    { value: 'video', label: 'Videos' },
    { value: 'image', label: 'Images' }
  ];

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
        return 'text-red-600 bg-red-100';
      case 'document':
        return 'text-blue-600 bg-blue-100';
      case 'image':
        return 'text-green-600 bg-green-100';
      case 'video':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleBookmark = (materialId) => {
    // In a real app, this would update the backend
    console.log('Toggle bookmark for material:', materialId);
  };

  const downloadMaterial = (material) => {
    fetch(`${import.meta.env.VITE_API_URL}/download/${material._id}`, {
      method: 'GET',
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to download file');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = material.originalFileName || material.name || 'file';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        alert('Failed to download file: ' + (error.message));
      });
  };

  // Update the filteredMaterials logic to use searchQuery for file name search only
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchQuery.trim() === '' ||
      (material.title && material.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (material.name && material.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = !selectedSubject || material.subject === selectedSubject;
    const matchesType = !selectedType || material.type === selectedType;
    if (activeTab === 'bookmarks') {
      return matchesSearch && matchesSubject && matchesType && material.isBookmarked;
    }
    if (activeTab === 'recent') {
      return matchesSearch && matchesSubject && matchesType && material.isNew;
    }
    return matchesSearch && matchesSubject && matchesType;
  });

  const getTabContent = () => {
    switch (activeTab) {
      case 'bookmarks':
        return filteredMaterials.filter(m => m.isBookmarked);
      case 'recent':
        return filteredMaterials.filter(m => m.isNew);
      case 'subjects':
        return filteredMaterials;
      default:
        return filteredMaterials;
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentProfile');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/90 shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Study Hub</span>
              <span className="ml-2 text-sm text-gray-500">Student Portal</span>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer shadow-md border-2 border-white hover:scale-105 transition-transform" onClick={() => setShowProfileMenu(v => !v)}>
                  <span>S</span>
                </div>
                {showProfileMenu && (
                  <div ref={profileMenuRef} className="absolute right-0 mt-3 w-40 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 overflow-hidden animate-fade-in">
                    <button
                      className="w-full text-left px-6 py-3 hover:bg-gray-100 text-gray-700 text-base font-medium border-b border-gray-200"
                      onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                    >
                      Profile
                    </button>
                    <button
                      className="w-full text-left px-6 py-3 hover:bg-gray-100 text-red-600 text-base font-semibold"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Materials
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 max-w-lg">
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials by file name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSearchQuery(searchInput); }}
                  className="w-full pl-10 pr-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setSearchQuery(searchInput)}
                  title="Search"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Faculty Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <input
            type="text"
            placeholder="Enter Faculty Employee ID"
            value={facultyIdInput}
            onChange={e => setFacultyIdInput(e.target.value)}
            className="w-full md:w-64 px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleFacultySearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Materials Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getTabContent().map((material, idx) => (
            <div key={material._id || material.id || idx} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getFileTypeColor(material.type)}`}>{getFileIcon(material.type)}</div>
                <button
                  onClick={() => downloadMaterial(material)}
                  className="p-1 text-[#0A66C2] hover:text-[#004182]"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{material.title || material.name}</h3>
              {material.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{material.description}</p>
              )}
              <div className="flex items-center text-xs text-gray-400 mt-auto">
                <span>Uploaded: {material.uploadedAt ? new Date(material.uploadedAt).toLocaleString() : 'N/A'}</span>
                {material.employeeId && (
                  <span className="ml-4 text-blue-600">Faculty ID: {material.employeeId}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {searchedFacultyId && materials.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-500">
              No materials found for faculty ID: {searchedFacultyId}
            </p>
          </div>
        )}

        {getTabContent().length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-500">
              {activeTab === 'bookmarks' 
                ? "You haven't bookmarked any materials yet."
                : activeTab === 'recent'
                ? "No recent uploads found."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StuDashboard;