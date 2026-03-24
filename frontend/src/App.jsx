import { useState, useEffect, useRef } from 'react';
import { Send, Plus, Database, ChevronRight, Loader2, Link2, Trash2, List } from 'lucide-react';
import { fetchHistory, fetchMessages, sendMessage, ingestData, deleteHistory, fetchKnowledge, deleteKnowledge } from './api';

function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [ingestType, setIngestType] = useState('url');
  const [ingestContent, setIngestContent] = useState('');
  const [manageKnowledgeOpen, setManageKnowledgeOpen] = useState(false);
  const [knowledgeSources, setKnowledgeSources] = useState([]);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadSessions = async () => {
    try {
      const data = await fetchHistory();
      setSessions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (id) => {
    try {
      const data = await fetchMessages(id);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setIsLoading(true);

    try {
      const res = await sendMessage(query, currentSessionId);
      if (!currentSessionId) {
        setCurrentSessionId(res.session_id);
        loadSessions();
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer, sources: res.sources },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Oops! Something went wrong communicating with the server.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!ingestContent.trim()) return;
    setIsIngesting(true);
    try {
      await ingestData(ingestType, ingestContent);
      alert('Data ingested successfully!');
      setIngestModalOpen(false);
      setIngestContent('');
    } catch (err) {
      alert('Error ingesting data: ' + err.message);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      if (!window.confirm("Are you sure you want to delete this chat history?")) return;
      await deleteHistory(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      alert('Error deleting session: ' + err.message);
    }
  };

  const handleOpenManageKnowledge = async () => {
    setManageKnowledgeOpen(true);
    setIsLoadingKnowledge(true);
    try {
      const data = await fetchKnowledge();
      setKnowledgeSources(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  const handleDeleteKnowledgeSource = async (source) => {
    try {
      if (!window.confirm(`Are you sure you want to delete the knowledge source: ${source}?`)) return;
      await deleteKnowledge(source);
      setKnowledgeSources(prev => prev.filter(s => s !== source));
    } catch (err) {
      alert('Error deleting knowledge: ' + err.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans dark:bg-zinc-950 dark:text-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col hidden md:flex transition-all duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            History
          </h2>
          <button
            onClick={() => setCurrentSessionId(null)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            title="New Chat"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2 mt-4">
            Recent Chats
          </div>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between group cursor-pointer ${currentSessionId === s.id
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'hover:bg-gray-100 text-gray-700 dark:hover:bg-zinc-800 dark:text-gray-300'
                }`}
            >
              <div className="truncate flex-1 text-sm font-medium pr-2">{s.title}</div>
              <button
                onClick={(e) => handleDeleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all flex-shrink-0"
                title="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 px-2 italic">No history found.</div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col gap-2">
          <button
            onClick={() => setIngestModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Database size={18} />
            Add Knowledge
          </button>
          <button
            onClick={handleOpenManageKnowledge}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 py-2.5 rounded-xl transition-all shadow-sm font-medium"
          >
            <List size={18} />
            Manage Knowledge
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white dark:bg-zinc-950">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-zinc-800 flex items-center px-6 justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            RAG Engine
            {currentSessionId && <span className="text-sm px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Active</span>}
          </h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto fade-in">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 shadow-inner">
                <Database size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Welcome to RAG Engine</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Ask anything! The system will retrieve relevant contexts from its knowledge base using vector search to provide precise, accurate answers.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
                  }`}
              >
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                      <Link2 size={12} /> Sources Citations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <div key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 flex items-center gap-1 cursor-help group relative">
                          {src.metadata?.source || 'Document'}
                          <div className="hidden group-hover:block absolute bottom-full mb-2 left-0 w-64 p-2 bg-black text-white rounded text-xs z-20 shadow-xl max-h-40 overflow-hidden line-clamp-6">
                            {src.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-500" size={20} />
                <span className="text-sm text-gray-500 font-medium">Synthesizing answer from sources...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <form
              className="relative flex items-center border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
              onSubmit={handleSend}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent px-6 py-4 outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm md:text-base"
                placeholder="Start typing your question..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="mx-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-zinc-700 text-white p-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Send size={18} />
              </button>
            </form>
            <div className="text-center mt-3 text-xs text-gray-400">
              Answers are generated locally using Ollama Gemma model and may contain inaccuracies.
            </div>
          </div>
        </div>
      </div>

      {/* Ingest Modal */}
      {ingestModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Add Knowledge</h3>
              <button onClick={() => setIngestModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">✕</button>
            </div>
            <form onSubmit={handleIngest} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source Type</label>
                <select
                  value={ingestType}
                  onChange={(e) => {
                    setIngestType(e.target.value);
                    setIngestContent(''); // reset content when switching
                  }}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                >
                  <option value="url">Website URL</option>
                  <option value="text">Raw Text</option>
                  <option value="pdf">PDF Document</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ingestType === 'url' ? 'URL Link' : ingestType === 'pdf' ? 'Upload PDF' : 'Text Content'}
                </label>
                {ingestType === 'url' ? (
                  <input
                    type="url"
                    value={ingestContent}
                    onChange={(e) => setIngestContent(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    placeholder="https://example.com/article"
                    required
                  />
                ) : ingestType === 'pdf' ? (
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setIngestContent(e.target.files[0])}
                    className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                ) : (
                  <textarea
                    value={ingestContent}
                    onChange={(e) => setIngestContent(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow h-32 resize-none"
                    placeholder="Paste textbook or documentation here..."
                    required
                  />
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIngestModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIngesting || !ingestContent}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isIngesting ? <Loader2 className="animate-spin" size={16} /> : <ChevronRight size={16} />}
                  {isIngesting ? 'Ingesting...' : 'Ingest Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Knowledge Modal */}
      {manageKnowledgeOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50 relative shrink-0">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Manage Knowledge</h3>
              <button onClick={() => setManageKnowledgeOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingKnowledge ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                </div>
              ) : knowledgeSources.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No knowledge sources found.
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeSources.map((source, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 rounded-xl">
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium break-all pr-2">
                        {source}
                      </div>
                      <button
                        onClick={() => handleDeleteKnowledgeSource(source)}
                        className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50 flex items-center gap-1"
                        title="Delete Source"
                      >
                        <Trash2 size={14} />
                        <span className="text-xs sm:hidden">Delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
