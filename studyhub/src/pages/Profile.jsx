import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  useEffect(() => {
    // Try to get user info from location.state, then from localStorage
    let userData = location.state?.user || location.state?.faculty;
    if (!userData) {
      // Try to get from localStorage (customize keys as per your app)
      const facultyToken = localStorage.getItem('facultyToken');
      const studentToken = localStorage.getItem('studentToken');
      if (facultyToken) {
        // Optionally decode token for info, or fetch from backend
        userData = JSON.parse(localStorage.getItem('facultyProfile') || '{}');
        userData.role = 'Faculty';
      } else if (studentToken) {
        userData = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        userData.role = 'Student';
      }
    }
    setUser(userData || {});
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-[#0A66C2] hover:underline">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </button>
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-[#0A66C2] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-2">
            {user.firstName ? user.firstName[0] : 'U'}
          </div>
          <div className="text-xl font-semibold text-gray-900 mb-1">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-sm text-gray-500 mb-1">{user.email}</div>
          {user.employeeId && (
            <div className="text-sm text-gray-500">Employee ID: {user.employeeId}</div>
          )}
          {user.collegeRegNumber && (
            <div className="text-sm text-gray-500">College Reg. No: {user.collegeRegNumber}</div>
          )}
          {user.role && (
            <div className="text-xs text-[#0A66C2] font-semibold mt-2">{user.role}</div>
          )}
        </div>
        {/* Add more profile details here if needed */}
      </div>
    </div>
  );
};

export default Profile; 