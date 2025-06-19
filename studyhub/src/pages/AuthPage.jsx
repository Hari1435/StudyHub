import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  User,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthPage = ({ onBack }) => {
  const [authMode, setAuthMode] = useState('select');
  const [userRole, setUserRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    collegeRegNumber: '',
    employeeId: '',
  });
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingUserId, setPendingUserId] = useState('');
  const [pendingFacultyId, setPendingFacultyId] = useState('');
  const [loginRole, setLoginRole] = useState('student');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setUserRole(role);
    setAuthMode('signup');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userRole === 'student' && authMode === 'signup') {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/signup`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          collegeRegNumber: formData.collegeRegNumber,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
        console.log('Student registration success:', res.data);
        setOtpMode(true);
        setPendingEmail(formData.email);
        setPendingUserId(res.data.userId || res.data._id || '');
      } catch (err) {
        console.error('Student registration error:', err.response?.data || err.message);
      }
      return;
    }
    if (userRole === 'teacher' && authMode === 'signup') {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL_fact}/signup`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          employeeId: formData.employeeId,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
        console.log('Faculty registration success:', res.data);
        setOtpMode(true);
        setPendingEmail(formData.email);
        setPendingFacultyId(res.data.facultyId || res.data._id || '');
      } catch (err) {
        console.error('Faculty registration error:', err.response?.data || err.message);
      }
      return;
    }
    if (authMode === 'login') {
      try {
        const url = loginRole === 'teacher'
          ? `${import.meta.env.VITE_API_URL_fact}/login`
          : `${import.meta.env.VITE_API_URL}/login`;
        const res = await axios.post(url, {
          email: formData.email,
          password: formData.password,
          role: loginRole
        });
        console.log('Login success:', res.data);
        if (loginRole === 'teacher') {
          const { firstName, lastName, employeeId } = res.data.faculty || {};
          // Store the token for authenticated requests
          if (res.data.token) {
            localStorage.setItem('facultyToken', res.data.token);
          }
          navigate('/FaDashboard', {
            state: {
              facultyName: `${firstName || ''} ${lastName || ''}`.trim(),
              employeeId: employeeId || '',
            },
          });
        } else {
          navigate('/StuDashboard');
        }
      } catch (err) {
        console.error('Login error:', err.response?.data || err.message);
      }
      return;
    }
    // Handle other cases (teacher, login, etc.)
    console.log('Form submitted:', { ...formData, role: userRole, mode: authMode });
  };

  const resetToRoleSelect = () => {
    setAuthMode('select');
    setUserRole(null);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      collegeRegNumber: '',
      employeeId: '',
    });
  };

  const getRoleIcon = () => {
    if (userRole === 'student') {
      return <GraduationCap className="h-8 w-8 text-blue-600" />;
    } else if (userRole === 'teacher') {
      return <Users className="h-8 w-8 text-green-600" />;
    }
    return <User className="h-8 w-8 text-gray-600" />;
  };

  const getRoleColor = () => {
    if (userRole === 'student') return 'blue';
    if (userRole === 'teacher') return 'green';
    return 'gray';
  };

  // OTP submit handler
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = userRole === 'student'
        ? `${import.meta.env.VITE_API_URL}/verify-otp`
        : `${import.meta.env.VITE_API_URL_fact}/verify-otp`;
      if (userRole === 'student') {
        const res = await axios.post(url, {
          userId: pendingUserId,
          otp,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: pendingEmail,
          collegeRegNumber: formData.collegeRegNumber,
          password: formData.password
        });
        console.log('OTP verification success:', res.data);
        navigate('/StuDashboard');
      } else if (userRole === 'teacher') {
        const res = await axios.post(url, {
          facultyId: pendingFacultyId,
          otp,
          firstName: formData.firstName,
          lastName: formData.lastName,
          employeeId: formData.employeeId,
          email: pendingEmail,
          password: formData.password
        });
        console.log('OTP verification success:', res.data);
        navigate('/FaDashboard');
      }
      setOtpMode(false);
      setPendingEmail('');
      setPendingUserId('');
      setPendingFacultyId('');
      setOtp('');
      // Optionally, redirect or show success message
    } catch (err) {
      console.error('OTP verification error:', err.response?.data || err.message);
    }
  };

  if (authMode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </button>

            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <BookOpen className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Study Hub</h1>
              <p className="text-gray-600">Choose your role to get started</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleRoleSelect('student')}
                className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl p-6 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">I'm a Student</h3>
                      <p className="text-sm text-gray-600">Access course materials and resources</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('teacher')}
                className="w-full bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-xl p-6 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">I'm a Teacher</h3>
                      <p className="text-sm text-gray-600">Upload and manage course content</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (otpMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Verify OTP</h2>
            <p className="text-gray-600 mb-6 text-center">Enter the 6-digit OTP sent to your email address.</p>
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <input
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                placeholder="------"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200"
              >
                Verify OTP
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={authMode === 'login' ? () => setAuthMode('select') : resetToRoleSelect}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {authMode === 'login' ? 'Back to Role Selection' : 'Change Role'}
          </button>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {getRoleIcon()}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {authMode === 'login' ? 'Welcome Back' : `${userRole === 'student' ? 'Student' : 'Teacher'} Registration`}
            </h1>
            <p className="text-gray-600">
              {authMode === 'login' 
                ? 'Sign in to your Study Hub account' 
                : `Create your ${userRole} account to get started`
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show radio buttons for login role selection only in login mode */}
            {authMode === 'login' && (
              <div className="flex items-center justify-center gap-8 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="loginRole"
                    value="student"
                    checked={loginRole === 'student'}
                    onChange={() => setLoginRole('student')}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Student</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="loginRole"
                    value="teacher"
                    checked={loginRole === 'teacher'}
                    onChange={() => setLoginRole('teacher')}
                    className="form-radio text-green-600"
                  />
                  <span className="ml-2">Teacher</span>
                </label>
              </div>
            )}

            {/* Only show name fields in signup mode */}
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            )}

            {userRole === 'student' && authMode === 'signup' && (
              <div>
                <label htmlFor="collegeRegNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  College Registration Number
                </label>
                <input
                  type="text"
                  id="collegeRegNumber"
                  name="collegeRegNumber"
                  value={formData.collegeRegNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., STU123456"
                  required
                />
              </div>
            )}

            {userRole === 'teacher' && authMode === 'signup' && (
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="EMP123456"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${getRoleColor()}-500 focus:border-transparent transition-all`}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${getRoleColor()}-500 focus:border-transparent transition-all`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {authMode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${getRoleColor()}-500 focus:border-transparent transition-all`}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200"
              style={{ display: 'block', fontSize: '1.1rem', marginTop: '1rem' }}
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'select' : 'login')}
                className={`text-${getRoleColor()}-600 hover:text-${getRoleColor()}-700 font-medium`}
              >
                {authMode === 'login' ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>

          {authMode === 'login' && (
            <div className="mt-4 text-center">
              <button className="text-sm text-gray-600 hover:text-gray-900">
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;