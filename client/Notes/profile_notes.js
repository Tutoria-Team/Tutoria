import React, { useState } from 'react';
import { User, Mail, Calendar, BookOpen, Award, Clock, MapPin, Edit2, Save, X } from 'lucide-react';

export default function TutoriaProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeRole, setActiveRole] = useState("Student"); // "Student", "Tutor", or "Both"
  const [profile, setProfile] = useState({
    name: "Sarah Johnson",
    email: "example@rpi.edu",
    roles: ["Student", "Tutor"], // User can have multiple roles
    joined: "January 2024",
    location: "Troy, NY",
    subjects: ["Mathematics", "Physics", "Computer Science"],
    bio: "Passionate educator with 5+ years of experience helping students achieve their academic goals. Specializing in STEM subjects and personalized learning approaches.",
    hourlyRate: "$45/hr",
    totalSessions: 127,
    rating: 4.9,
    availability: ["Monday 2-6 PM", "Wednesday 3-7 PM", "Friday 1-5 PM"],
    // Student-specific data
    majorField: "Computer Science",
    yearLevel: "Junior",
    learningGoals: ["Improve calculus skills", "Prepare for physics exam", "Learn data structures"],
    studentBio: "Computer Science junior passionate about learning and growing. Looking to improve my math and physics skills while exploring new subjects.",
    tutorBio: "Passionate educator with 5+ years of experience helping students achieve their academic goals. Specializing in STEM subjects and personalized learning approaches."
  });

  const [editForm, setEditForm] = useState(profile);

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(profile);
  };

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const isTutor = activeRole === "Tutor";
  const hasBothRoles = profile.roles.length > 1;
  const currentBio = isTutor ? profile.tutorBio : profile.studentBio;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-serif text-stone-800">Tutoria</span>
          </div>
          <nav className="flex items-center gap-8">
            <a href="#" className="text-stone-600 hover:text-stone-900 transition">Dashboard</a>
            <a href="#" className="text-stone-600 hover:text-stone-900 transition">Find a Tutor</a>
            <a href="#" className="text-stone-900 font-medium border-b-2 border-amber-600 pb-1">Profile</a>
            <button className="text-stone-600 hover:text-stone-900 transition">Logout</button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Role Toggle - Only show if user has both roles */}
        {hasBothRoles && (
          <div className="mb-8 flex justify-center">
            <div className="inline-flex bg-white rounded-xl shadow-lg border border-stone-200 p-1.5">
              <button
                onClick={() => setActiveRole("Student")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeRole === "Student"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Student Profile
                </div>
              </button>
              <button
                onClick={() => setActiveRole("Tutor")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeRole === "Tutor"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Tutor Profile
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center mb-4">
                  <User className="w-16 h-16 text-white" />
                </div>
                
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="text-2xl font-serif text-center mb-2 border-b-2 border-amber-500 focus:outline-none px-2"
                  />
                ) : (
                  <h1 className="text-2xl font-serif text-stone-800 mb-2">{profile.name}</h1>
                )}
                
                <span className="inline-block px-4 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-4">
                  {activeRole}
                </span>

                <div className="w-full space-y-3 text-stone-600 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {profile.joined}</span>
                  </div>
                  {!isTutor && (
                    <>
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4" />
                        <span>{profile.majorField}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award className="w-4 h-4" />
                        <span>{profile.yearLevel}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="w-full grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-stone-200">
                  {isTutor ? (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-stone-800">{profile.totalSessions}</div>
                        <div className="text-xs text-stone-500">Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-stone-800">{profile.rating}</div>
                        <div className="text-xs text-stone-500">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-stone-800">{profile.hourlyRate}</div>
                        <div className="text-xs text-stone-500">Rate</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-stone-800">{profile.totalSessions}</div>
                        <div className="text-xs text-stone-500">Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-stone-800">{profile.learningGoals.length}</div>
                        <div className="text-xs text-stone-500">Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-stone-800">{profile.subjects.length}</div>
                        <div className="text-xs text-stone-500">Subjects</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shadow-md"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-6 py-3 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </>
              )}
            </div>

            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
              <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-3">
                <User className="w-5 h-5 text-amber-600" />
                {isTutor ? "About Me" : "About"}
              </h2>
              {isEditing ? (
                <textarea
                  value={isTutor ? editForm.tutorBio : editForm.studentBio}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    [isTutor ? 'tutorBio' : 'studentBio']: e.target.value
                  })}
                  className="w-full p-4 border-2 border-stone-200 rounded-lg focus:border-amber-500 focus:outline-none resize-none"
                  rows="4"
                  placeholder={isTutor ? "Tell students about your teaching experience..." : "Share a bit about yourself and your learning journey..."}
                />
              ) : (
                <p className="text-stone-600 leading-relaxed">{currentBio}</p>
              )}
            </div>

            {/* Subjects or Learning Goals */}
            {isTutor ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
                <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  Subjects I Teach
                </h2>
                <div className="flex flex-wrap gap-3">
                  {profile.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-amber-100 hover:text-amber-800 transition"
                    >
                      {subject}
                    </span>
                  ))}
                  {isEditing && (
                    <button className="px-4 py-2 border-2 border-dashed border-stone-300 text-stone-500 rounded-lg text-sm hover:border-amber-500 hover:text-amber-600 transition">
                      + Add Subject
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
                  <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    Subjects I'm Learning
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {profile.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-amber-100 hover:text-amber-800 transition"
                      >
                        {subject}
                      </span>
                    ))}
                    {isEditing && (
                      <button className="px-4 py-2 border-2 border-dashed border-stone-300 text-stone-500 rounded-lg text-sm hover:border-amber-500 hover:text-amber-600 transition">
                        + Add Subject
                      </button>
                    )}
                  </div>
                </div>

                {/* Learning Goals for Students */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
                  <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-600" />
                    My Learning Goals
                  </h2>
                  <div className="space-y-3">
                    {profile.learningGoals.map((goal, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-stone-50 rounded-lg border border-stone-200"
                      >
                        <div className="w-5 h-5 mt-0.5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                        </div>
                        <span className="text-stone-700">{goal}</span>
                      </div>
                    ))}
                    {isEditing && (
                      <button className="w-full p-4 border-2 border-dashed border-stone-300 text-stone-500 rounded-lg hover:border-amber-500 hover:text-amber-600 transition">
                        + Add Learning Goal
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Availability or Recent Sessions */}
            {isTutor ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
                <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Availability
                </h2>
                <div className="space-y-3">
                  {profile.availability.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-200"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-stone-700">{slot}</span>
                    </div>
                  ))}
                  {isEditing && (
                    <button className="w-full p-4 border-2 border-dashed border-stone-300 text-stone-500 rounded-lg hover:border-amber-500 hover:text-amber-600 transition">
                      + Add Time Slot
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
                <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Upcoming Sessions
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-200">
                    <div>
                      <div className="font-semibold text-stone-800">Physics - Mechanics</div>
                      <div className="text-sm text-stone-600">with Dr. Michael Chen</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-stone-800">Tomorrow</div>
                      <div className="text-xs text-stone-600">3:00 PM</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-200">
                    <div>
                      <div className="font-semibold text-stone-800">Calculus II</div>
                      <div className="text-sm text-stone-600">with Prof. Emily Rodriguez</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-stone-800">Friday</div>
                      <div className="text-xs text-stone-600">2:00 PM</div>
                    </div>
                  </div>
                  <button className="w-full p-4 text-center text-amber-600 hover:text-amber-700 font-medium transition">
                    View All Sessions →
                  </button>
                </div>
              </div>
            )}

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
              <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-600" />
                Achievements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isTutor ? (
                  <>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                      <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-800">Top Rated</div>
                        <div className="text-sm text-stone-600">Maintained 4.9+ rating</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-800">100+ Sessions</div>
                        <div className="text-sm text-stone-600">Milestone reached</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-800">Consistent Learner</div>
                        <div className="text-sm text-stone-600">100+ sessions completed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-800">Quick Starter</div>
                        <div className="text-sm text-stone-600">First session within 24hrs</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}