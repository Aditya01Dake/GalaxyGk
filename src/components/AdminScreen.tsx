import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Loader2, Trash2, Users, FileText, Plus, Image as ImageIcon, Video, PlayCircle, Award, HelpCircle, UserPlus } from 'lucide-react';
import { collection, query, orderBy, getDocs, deleteDoc, doc, addDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface UserData {
  id: string;
  customId: string;
  name: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  isBanned?: boolean;
}

interface LiveClass {
  id: string;
  title: string;
  description: string;
  roomName: string;
  type?: 'camera' | 'video';
  videoUrl?: string;
  status: 'upcoming' | 'live' | 'ended';
  createdAt: string;
}

interface ContentItem {
  id: string;
  type: 'ad' | 'pdf' | 'paper' | 'video';
  title: string;
  description?: string;
  url: string;
  createdAt: string;
}

interface Certificate {
  id: string;
  userId: string;
  title: string;
  url: string;
  createdAt: string;
}

interface Message {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Props {
  userRole: 'admin' | 'staff' | 'user';
  onBack: () => void;
}

export const AdminScreen: React.FC<Props> = ({ userRole, onBack }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'live-classes' | 'videos' | 'content' | 'certificates' | 'messages' | 'staff' | 'settings'>('users');
  
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Forms
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [newClassType, setNewClassType] = useState<'camera' | 'video'>('camera');
  const [newClassVideoUrl, setNewClassVideoUrl] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);

  const [newItemType, setNewItemType] = useState<'ad' | 'pdf' | 'paper' | 'video'>('video');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [isAddingContent, setIsAddingContent] = useState(false);

  const [newCertUserId, setNewCertUserId] = useState('');
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertUrl, setNewCertUrl] = useState('');
  const [isAddingCert, setIsAddingCert] = useState(false);

  const [newMessageUserId, setNewMessageUserId] = useState('');
  const [newMessageTitle, setNewMessageTitle] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isAddingMessage, setIsAddingMessage] = useState(false);

  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Users
      const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapUsers = await getDocs(qUsers);
      const fetchedUsers: UserData[] = [];
      snapUsers.forEach((doc) => {
        const data = doc.data();
        fetchedUsers.push({
          id: doc.id,
          customId: data.customId || 'N/A',
          name: data.name,
          role: data.role,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin || data.createdAt,
          isBanned: data.isBanned || false
        });
      });
      setUsersList(fetchedUsers);

      // Fetch Live Classes
      const qClasses = query(collection(db, 'live_classes'), orderBy('createdAt', 'desc'));
      const snapClasses = await getDocs(qClasses);
      const fetchedClasses: LiveClass[] = [];
      snapClasses.forEach((doc) => {
        fetchedClasses.push({ id: doc.id, ...doc.data() } as LiveClass);
      });
      setLiveClasses(fetchedClasses);

      // Fetch Content
      const qContent = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
      const snapContent = await getDocs(qContent);
      const fetchedContent: ContentItem[] = [];
      snapContent.forEach((doc) => {
        fetchedContent.push({ id: doc.id, ...doc.data() } as ContentItem);
      });
      setContents(fetchedContent);

      // Fetch Certificates
      const qCerts = query(collection(db, 'certificates'), orderBy('createdAt', 'desc'));
      const snapCerts = await getDocs(qCerts);
      const fetchedCerts: Certificate[] = [];
      snapCerts.forEach((doc) => {
        fetchedCerts.push({ id: doc.id, ...doc.data() } as Certificate);
      });
      setCertificates(fetchedCerts);

      // Fetch Messages
      const qMessages = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const snapMessages = await getDocs(qMessages);
      const fetchedMessages: Message[] = [];
      snapMessages.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(fetchedMessages);

    } catch (error) {
      console.error("Error fetching admin data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassTitle || (newClassType === 'camera' && !newClassRoom) || (newClassType === 'video' && !newClassVideoUrl)) return;
    setIsAddingClass(true);
    try {
      await addDoc(collection(db, 'live_classes'), {
        title: newClassTitle,
        description: newClassDesc,
        roomName: newClassType === 'camera' ? newClassRoom : '',
        type: newClassType,
        videoUrl: newClassType === 'video' ? newClassVideoUrl : '',
        status: 'upcoming',
        createdAt: new Date().toISOString()
      });
      setNewClassTitle('');
      setNewClassDesc('');
      setNewClassRoom('');
      setNewClassVideoUrl('');
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'live_classes');
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleUpdateClassStatus = async (id: string, status: 'upcoming' | 'live' | 'ended') => {
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'live_classes', id), { status });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'live_classes');
    }
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle || !newItemUrl) return;
    setIsAddingContent(true);
    try {
      await addDoc(collection(db, 'content'), {
        type: newItemType,
        title: newItemTitle,
        description: newItemDesc,
        url: newItemUrl,
        createdAt: new Date().toISOString()
      });
      setNewItemTitle('');
      setNewItemDesc('');
      setNewItemUrl('');
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'content');
    } finally {
      setIsAddingContent(false);
    }
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertUserId || !newCertTitle || !newCertUrl) return;
    setIsAddingCert(true);
    try {
      await addDoc(collection(db, 'certificates'), {
        userId: newCertUserId,
        title: newCertTitle,
        url: newCertUrl,
        createdAt: new Date().toISOString()
      });
      setNewCertUserId('');
      setNewCertTitle('');
      setNewCertUrl('');
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'certificates');
    } finally {
      setIsAddingCert(false);
    }
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageUserId || !newMessageTitle || !newMessageContent) return;
    setIsAddingMessage(true);
    try {
      await addDoc(collection(db, 'messages'), {
        userId: newMessageUserId,
        title: newMessageTitle,
        content: newMessageContent,
        createdAt: new Date().toISOString()
      });
      setNewMessageUserId('');
      setNewMessageTitle('');
      setNewMessageContent('');
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    } finally {
      setIsAddingMessage(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail) return;
    setIsAddingStaff(true);
    try {
      // In a real app, we'd send an invite. Here we just add to a staff_invites collection
      // or if they exist, update their role. Since we can't search by email easily without a query,
      // let's just add an invite document.
      await addDoc(collection(db, 'staff_invites'), {
        email: newStaffEmail,
        createdAt: new Date().toISOString()
      });
      alert(`Staff invite recorded for ${newStaffEmail}. They will be staff on next login.`);
      setNewStaffEmail('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'staff_invites');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, collectionName, id));
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collectionName);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), {
        isBanned: !currentStatus
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('WARNING: This will delete ALL users, classes, videos, content, certificates, and messages. This action CANNOT be undone. Are you absolutely sure?')) return;
    if (!window.confirm('FINAL WARNING: Type OK to proceed.') || window.prompt('Type "DELETE ALL" to confirm:') !== 'DELETE ALL') return;
    
    setLoading(true);
    try {
      const collections = ['users', 'live_classes', 'content', 'certificates', 'messages', 'staff_invites', 'questions', 'results'];
      for (const col of collections) {
        const q = query(collection(db, col));
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }
      alert('All data has been cleared successfully.');
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'multiple_collections');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold flex items-center">
            <Shield className="w-6 h-6 mr-3 text-indigo-500" />
            {userRole === 'admin' ? 'Admin Panel' : 'Staff Panel'}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-4 mb-8 space-x-2 scrollbar-hide">
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users />} text="Users" />
          <TabButton active={activeTab === 'live-classes'} onClick={() => setActiveTab('live-classes')} icon={<Video />} text="Live Classes" />
          <TabButton active={activeTab === 'videos'} onClick={() => setActiveTab('videos')} icon={<PlayCircle />} text="Videos" />
          <TabButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<FileText />} text="Content" />
          <TabButton active={activeTab === 'certificates'} onClick={() => setActiveTab('certificates')} icon={<Award />} text="Certificates" />
          <TabButton active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} icon={<HelpCircle />} text="Messages" />
          {userRole === 'admin' && (
            <>
              <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<UserPlus />} text="Staff" />
              <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Shield />} text="Settings" />
            </>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-slate-300 text-sm uppercase tracking-wider border-b border-slate-600">
                    <th className="p-4 font-medium">User ID</th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Last Login</th>
                    {userRole === 'admin' && <th className="p-4 font-medium text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 font-mono text-indigo-400 font-bold">{u.customId}</td>
                      <td className="p-4 text-slate-200">{u.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-rose-500/20 text-rose-400' : 
                          u.role === 'staff' ? 'bg-amber-500/20 text-amber-400' : 
                          'bg-slate-600 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {new Date(u.lastLogin).toLocaleString('mr-IN')}
                      </td>
                      {userRole === 'admin' && (
                        <td className="p-4 text-right flex justify-end items-center space-x-2">
                          <button 
                            onClick={() => handleToggleBan(u.id, u.isBanned || false)} 
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              u.isBanned 
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                            }`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                          <button onClick={() => handleDelete('users', u.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'live-classes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl h-fit">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Video className="w-5 h-5 mr-2 text-rose-400" />
                Schedule Live Class
              </h2>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Class Title</label>
                  <input type="text" required value={newClassTitle} onChange={(e) => setNewClassTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <textarea value={newClassDesc} onChange={(e) => setNewClassDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none h-24 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Class Type</label>
                  <select value={newClassType} onChange={(e) => setNewClassType(e.target.value as 'camera' | 'video')} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none">
                    <option value="camera">Camera Live (Jitsi)</option>
                    <option value="video">Video Stream</option>
                  </select>
                </div>
                {newClassType === 'camera' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Room Name (Unique ID)</label>
                    <input type="text" required value={newClassRoom} onChange={(e) => setNewClassRoom(e.target.value.replace(/\s+/g, '-'))} placeholder="e.g. math-class-101" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Video URL (YouTube/MP4)</label>
                    <input type="url" required value={newClassVideoUrl} onChange={(e) => setNewClassVideoUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                )}
                <button type="submit" disabled={isAddingClass} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center disabled:opacity-50">
                  {isAddingClass ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Schedule Class'}
                </button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {liveClasses.map((cls) => (
                <div key={cls.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-white">{cls.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300">
                        {cls.type === 'video' ? 'Video' : 'Camera'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{cls.description}</p>
                    {cls.type === 'camera' ? (
                      <p className="text-indigo-400 font-mono text-xs mt-2">Room: {cls.roomName}</p>
                    ) : (
                      <p className="text-indigo-400 font-mono text-xs mt-2 truncate max-w-xs">URL: {cls.videoUrl}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={cls.status}
                      onChange={(e) => handleUpdateClassStatus(cls.id, e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="ended">Ended</option>
                    </select>
                    <button onClick={() => handleDelete('live_classes', cls.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'videos' || activeTab === 'content') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl h-fit">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-indigo-400" />
                Add Content
              </h2>
              <form onSubmit={handleAddContent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                  <select value={newItemType} onChange={(e) => setNewItemType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="paper">Paper</option>
                    <option value="ad">Ad / Banner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                  <input type="text" required value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
                  <textarea value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">URL (YouTube / Drive Link)</label>
                  <input type="url" required value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <button type="submit" disabled={isAddingContent} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center disabled:opacity-50">
                  {isAddingContent ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                </button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {contents.filter(c => activeTab === 'videos' ? c.type === 'video' : c.type !== 'video').map((item) => (
                <div key={item.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs uppercase font-bold">{item.type}</span>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    </div>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-sm hover:underline truncate max-w-md block">{item.url}</a>
                  </div>
                  <button onClick={() => handleDelete('content', item.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl h-fit">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-400" />
                Send Certificate
              </h2>
              <form onSubmit={handleAddCertificate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">User ID (e.g. GK001)</label>
                  <input type="text" required value={newCertUserId} onChange={(e) => setNewCertUserId(e.target.value.toUpperCase())} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Certificate Title</label>
                  <input type="text" required value={newCertTitle} onChange={(e) => setNewCertTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Certificate URL</label>
                  <input type="url" required value={newCertUrl} onChange={(e) => setNewCertUrl(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <button type="submit" disabled={isAddingCert} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center disabled:opacity-50">
                  {isAddingCert ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send'}
                </button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{cert.title}</h3>
                    <p className="text-slate-400 text-sm mt-1">To: <span className="font-mono text-amber-400">{cert.userId}</span></p>
                  </div>
                  <button onClick={() => handleDelete('certificates', cert.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl h-fit">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <HelpCircle className="w-5 h-5 mr-2 text-indigo-400" />
                Send Message
              </h2>
              <form onSubmit={handleAddMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">User ID (e.g. GK001)</label>
                  <input type="text" required value={newMessageUserId} onChange={(e) => setNewMessageUserId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                  <input type="text" required value={newMessageTitle} onChange={(e) => setNewMessageTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Message Content</label>
                  <textarea required value={newMessageContent} onChange={(e) => setNewMessageContent(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none" />
                </div>
                <button type="submit" disabled={isAddingMessage} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center disabled:opacity-50">
                  {isAddingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Message'}
                </button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{msg.title}</h3>
                    <p className="text-slate-300 mt-2">{msg.content}</p>
                    <p className="text-slate-500 text-sm mt-3">To: <span className="font-mono text-amber-400">{msg.userId}</span></p>
                  </div>
                  <button onClick={() => handleDelete('messages', msg.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'staff' && userRole === 'admin' && (
          <div className="max-w-md mx-auto bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <UserPlus className="w-6 h-6 mr-3 text-emerald-400" />
              Add Staff Member
            </h2>
            <p className="text-slate-400 mb-6">Enter the Gmail address of the person you want to make a staff member. They will automatically get staff privileges on their next login.</p>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Staff Gmail Address</label>
                <input type="email" required value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <button type="submit" disabled={isAddingStaff} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center disabled:opacity-50">
                {isAddingStaff ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Staff'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'settings' && userRole === 'admin' && (
          <div className="max-w-md mx-auto bg-slate-800 rounded-3xl p-8 border border-rose-900/50 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-rose-400">
              <Shield className="w-6 h-6 mr-3" />
              Danger Zone
            </h2>
            <p className="text-slate-400 mb-6">These actions are irreversible. Please be absolutely certain before proceeding.</p>
            
            <div className="space-y-4 border-t border-slate-700 pt-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Clear All Data</h3>
                <p className="text-sm text-slate-500 mb-4">This will permanently delete all users, live classes, videos, content, certificates, and messages from the database.</p>
                <button 
                  onClick={handleClearAllData}
                  className="w-full bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-600/50 font-medium py-3 rounded-xl transition-colors flex justify-center items-center"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete All Data
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, text }: { active: boolean, onClick: () => void, icon: React.ReactNode, text: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
    }`}
  >
    <span className="mr-2 w-5 h-5">{icon}</span>
    {text}
  </button>
);
