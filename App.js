// =================== Imports ===================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
} from 'reactflow';
import CustomNode from './CustomNode';
import 'reactflow/dist/style.css';

// =================== Constants ===================
const nodeTypes = {
  userQuery: CustomNode,
  knowledgeBase: CustomNode,
  llmEngine: CustomNode,
  output: CustomNode,
};

const initialNodes = [];
const initialEdges = [];

const componentTypes = [
  { label: '📝 User Query', type: 'userQuery', color: '#FFCDD2', tip: 'Start: add your question and points.' },
  { label: '📄 Knowledge Base', type: 'knowledgeBase', color: '#C8E6C9', tip: 'Upload files; choose embedding model.' },
  { label: '🤖 LLM Engine', type: 'llmEngine', color: '#BBDEFB', tip: 'Select model, prompt, temperature, API key.' },
  { label: '💬 Output', type: 'output', color: '#FFF9C4', tip: 'Final result appears here.' },
];

const PRESETS = [
  {
    name: 'Basic RAG',
    nodes: [
      { id: 'u1', type: 'userQuery', position: { x: 50, y: 120 }, data: { label: '📝 User Query', color: '#FFCDD2', points: '', queryText: 'Summarize the document', file: null, embeddingModel: 'text-embedding-3-large', apiKey: '', llmModel: 'gpt-4o-mini', temperature: 0.7, prompt: 'You are a helpful assistant.', webSearchTool: 'SerpAPI', outputText: '', uploadedFiles: [] } },
      { id: 'k1', type: 'knowledgeBase', position: { x: 320, y: 120 }, data: { label: '📄 Knowledge Base', color: '#C8E6C9', file: null, embeddingModel: 'text-embedding-3-large', apiKey: '', uploadedFiles: [], collection_name: '', chunk_size: 1000, chunk_overlap: 200 } },
      { id: 'l1', type: 'llmEngine', position: { x: 590, y: 120 }, data: { label: '🤖 LLM Engine', color: '#BBDEFB', llmModel: 'gpt-4o-mini', apiKey: '', prompt: 'Answer using provided context.', temperature: 0.7, webSearchTool: 'SerpAPI', maxTokens: 1000, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 } },
      { id: 'o1', type: 'output', position: { x: 860, y: 120 }, data: { label: '💬 Output', color: '#FFF9C4', outputText: '', title: '', allowFollowUp: false } },
    ],
    edges: [
      { id: 'e1', source: 'u1', target: 'k1' },
      { id: 'e2', source: 'k1', target: 'l1' },
      { id: 'e3', source: 'l1', target: 'o1' },
    ],
  },
  {
    name: 'No-KB Direct QA',
    nodes: [
      { id: 'u2', type: 'userQuery', position: { x: 100, y: 180 }, data: { label: '📝 User Query', color: '#FFCDD2', queryText: 'What is React Flow?', points: '' } },
      { id: 'l2', type: 'llmEngine', position: { x: 400, y: 180 }, data: { label: '🤖 LLM Engine', color: '#BBDEFB', llmModel: 'gpt-4o-mini', apiKey: '', prompt: 'Answer clearly and briefly.', temperature: 0.7, webSearchTool: 'SerpAPI', maxTokens: 1000 } },
      { id: 'o2', type: 'output', position: { x: 700, y: 180 }, data: { label: '💬 Output', color: '#FFF9C4', outputText: '' } },
    ],
    edges: [
      { id: 'e4', source: 'u2', target: 'l2' },
      { id: 'e5', source: 'l2', target: 'o2' },
    ],
  },
];

// =================== File Upload Component ===================
const EnhancedFileUpload = ({ onFileUpload, uploadedFiles = [], embeddingModel, updateNodeData }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelection(files);
  };

  const handleFileSelection = async (files) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFile(file);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload_file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      const fileInfo = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        path: result.file_path,
        uploadedAt: new Date().toISOString(),
        preview: result.preview || ''
      };

      if (onFileUpload) {
        onFileUpload(fileInfo);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
  };

  const removeFile = (fileId) => {
    if (updateNodeData) {
      const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
      updateNodeData('uploadedFiles', updatedFiles);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('docx')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
    if (fileType.includes('text')) return '📃';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📁';
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Supported file types info */}
      <div style={{ 
        background: '#eff6ff', 
        border: '1px solid #bfdbfe', 
        borderRadius: 8, 
        padding: 12, 
        marginBottom: 12,
        fontSize: '0.75rem'
      }}>
        <strong style={{ color: '#1e40af', marginBottom: 4, display: 'block' }}>Supported Files:</strong>
        <div>📄 PDF • 📝 Word (DOC/DOCX) • 📊 Excel (XLS/XLSX) • 📈 PowerPoint</div>
        <div>📃 Text Files • 🖼️ Images • 🎵 Audio • 🎥 Video • 📦 Archives</div>
      </div>

      {/* Upload zone */}
      <div
        style={{
          border: isDragging ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#f0f9ff' : '#f9fafb',
          transition: 'all 0.3s ease',
          marginBottom: 12
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ fontSize: '2em', marginBottom: 8 }}>📁</div>
        <div style={{ color: '#374151', marginBottom: 4 }}>
          {isDragging ? 'Drop files here...' : 'Click to select files or drag and drop'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          Supports DOCX, PDF, Excel, Images, and many more formats
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.875rem' }}>
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: 4, height: 8 }}>
            <div
              style={{ 
                width: `${uploadProgress}%`, 
                backgroundColor: '#3b82f6', 
                height: '100%', 
                borderRadius: 4, 
                transition: 'width 0.3s' 
              }}
            />
          </div>
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles && uploadedFiles.length > 0 && (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 8, fontSize: '0.875rem' }}>Uploaded Files:</div>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 8,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 6,
                marginBottom: 4,
                fontSize: '0.875rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 8 }}>{getFileIcon(file.type)}</span>
                <div>
                  <div style={{ fontWeight: 500 }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleTimeString()}
                  </div>
                  {file.preview && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', maxWidth: 200 }}>
                      {file.preview.substring(0, 100)}...
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =================== App Component ===================
function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isWorkflowBuilt, setIsWorkflowBuilt] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const flowWrapperRef = useRef(null);
  const fileInputRef = useRef(null);

  // ------------------ Helpers ------------------
  const updateNodeData = useCallback((key, value) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: value } } : n
      )
    );
  }, [selectedNode, setNodes]);

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);

  const isValidConnection = useCallback(
    (conn) => {
      const sourceType = nodes.find((n) => n.id === conn.source)?.type;
      const targetType = nodes.find((n) => n.id === conn.target)?.type;

      return (
        (sourceType === 'userQuery' && (targetType === 'knowledgeBase' || targetType === 'llmEngine')) ||
        (sourceType === 'knowledgeBase' && targetType === 'llmEngine') ||
        (sourceType === 'llmEngine' && targetType === 'output')
      );
    },
    [nodes]
  );

  const onConnect = useCallback((params) => {
    if (!isValidConnection(params)) { alert('❌ Invalid connection for the required order.'); return; }
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges, isValidConnection]);

  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const bounds = flowWrapperRef.current?.getBoundingClientRect();
    const position = { x: event.clientX - (bounds?.left ?? 0) - 100, y: event.clientY - (bounds?.top ?? 0) - 30 };
    const id = `${Date.now()}`;
    const comp = componentTypes.find((c) => c.type === type);
    const newNode = {
      id,
      type,
      position,
      data: {
        label: comp?.label || 'Node',
        color: comp?.color || '#fff',
        points: '',
        queryText: '',
        file: null,
        embeddingModel: 'text-embedding-3-large',
        apiKey: '',
        llmModel: 'gpt-4o-mini',
        temperature: 0.7,
        prompt: '',
        webSearchTool: 'SerpAPI',
        outputText: '',
        uploadedFiles: [],
        collection_name: '',
        chunk_size: 1000,
        chunk_overlap: 200,
        maxTokens: 1000,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        title: '',
        allowFollowUp: false
      }
    };
    setNodes((nds) => nds.concat(newNode));
    setLogs((l) => l.concat(`➕ Added node: ${newNode.data.label}`));
  }, [setNodes]);

  // ------------------ Enhanced Workflow Validation ------------------
  const validateWorkflow = useCallback(() => {
    const errors = [];
    if (nodes.length === 0) { errors.push('No nodes in workflow.'); setValidationErrors(errors); return false; }
    const nodeTypesSet = new Set(nodes.map((n) => n.type));
    if (!nodeTypesSet.has('userQuery')) errors.push('User Query node missing.');
    if (!nodeTypesSet.has('llmEngine')) errors.push('LLM Engine node missing.');
    if (!nodeTypesSet.has('output')) errors.push('Output node missing.');

    nodes.forEach((n) => {
      if (n.type === 'userQuery' && !n.data.queryText) {
        errors.push('User Query: query text required.');
      }
      
      if (n.type === 'knowledgeBase' && (!n.data.file && (!n.data.uploadedFiles || n.data.uploadedFiles.length === 0))) {
        errors.push('Knowledge Base: file required.');
      }
      
      if (n.type === 'llmEngine') {
        if (!n.data.llmModel) {
          errors.push('LLM Engine: model required.');
        }
        
        // Enhanced API key validation
        const hasNodeApiKey = n.data.apiKey && n.data.apiKey.trim() !== '';
        const hasEnvApiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;
        
        if (!hasNodeApiKey && !hasEnvApiKey) {
          errors.push(`LLM Engine (${n.data.label || n.id}): API key required. Either enter it in the configuration or set environment variable.`);
        }
        
        if (!n.data.prompt) {
          errors.push('LLM Engine: system prompt required.');
        }
        
        // Validate API key format
        if (hasNodeApiKey) {
          const apiKey = n.data.apiKey.trim();
          const model = n.data.llmModel?.toLowerCase() || '';
          
          if (model.includes('gpt') || model.includes('openai')) {
            if (!apiKey.startsWith('sk-')) {
              errors.push(`LLM Engine: OpenAI API key should start with 'sk-'`);
            }
          } else if (model.includes('gemini')) {
            if (!apiKey.startsWith('AIzaSy')) {
              errors.push(`LLM Engine: Google API key should start with 'AIzaSy'`);
            }
          }
        }
      }
    });

    // Edge order check
    const edgesMap = {};
    edges.forEach((e) => { if (!edgesMap[e.source]) edgesMap[e.source] = []; edgesMap[e.source].push(e.target); });
    const visited = new Set();
    const starts = nodes.filter((n) => n.type === 'userQuery').map((n) => n.id);
    const queue = [...starts];
    const order = [];
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      order.push(current);
      if (edgesMap[current]) queue.push(...edgesMap[current]);
    }

    const typeOrder = order.map((id) => nodes.find((n) => n.id === id)?.type);
    const userQueryIndex = typeOrder.indexOf('userQuery');
    const llmIndex = typeOrder.indexOf('llmEngine');
    const outputIndex = typeOrder.indexOf('output');

    if (userQueryIndex === -1 || llmIndex === -1 || outputIndex === -1) {
      errors.push('Workflow not connected from User Query → LLM Engine → Output.');
    } else if (!(userQueryIndex < llmIndex && llmIndex < outputIndex)) {
      errors.push('Nodes must be connected in order: User Query → LLM Engine → Output.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [nodes, edges]);

  // ------------------ Build & Run ------------------
  const handleBuildStack = () => {
    const valid = validateWorkflow();
    setIsWorkflowBuilt(valid);
    if (valid) {
      setLogs((l) => l.concat('✅ Workflow built successfully.'));
      alert('Workflow built successfully! You can now chat.');
    } else {
      setLogs((l) => l.concat('❌ Build failed. Fix validation errors.'));
    }
  };

  const runWorkflow = async (userQuery) => {
    if (!isWorkflowBuilt) {
      alert('Build the workflow first!');
      return null;
    }
    const ok = validateWorkflow();
    if (!ok) {
      alert('Workflow invalid. Check configuration.');
      return null;
    }

    setLogs((l) => l.concat('▶️ Executing workflow...'));

    try {
      // Prepare nodes with API keys
      const processedNodes = nodes.map(node => {
        if (node.type === 'llmEngine') {
          const apiKey = node.data.apiKey || 
            process.env.REACT_APP_OPENAI_API_KEY || 
            process.env.REACT_APP_GOOGLE_API_KEY;
          
          return {
            ...node,
            data: {
              ...node.data,
              apiKey: apiKey
            }
          };
        }
        return node;
      });

      const response = await fetch('http://localhost:8000/run_workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: processedNodes, edges, query: userQuery }),
      });

      if (!response.ok) {
        throw new Error('Backend error: ' + response.status);
      }

      const data = await response.json();
      const resultText = data?.result ?? '';

      // Write result into first Output node for visibility
      setNodes((nds) =>
        nds.map((n) =>
          n.type === 'output'
            ? { ...n, data: { ...n.data, outputText: resultText } }
            : n
        )
      );

      setLogs((l) => l.concat('✅ Workflow complete!'));
      return resultText;
    } catch (err) {
      setLogs((l) => l.concat('❌ Error: ' + err.message));
      return null;
    }
  };

  const handleSend = async () => {
    if (!query.trim() || isSending) return;
    setIsSending(true);
    const currentQuery = query;
    setChatLog((log) => log.concat({ user: currentQuery, bot: '...' }));
    setQuery('');
    try {
      const response = await runWorkflow(currentQuery);
      setChatLog((log) =>
        log.map((c, i) =>
          i === log.length - 1 ? { ...c, bot: response || 'No response' } : c
        )
      );
    } catch (err) {
      setChatLog((log) =>
        log.map((c, i) =>
          i === log.length - 1 ? { ...c, bot: 'Error: ' + err.message } : c
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  // ------------------ Import / Export / Presets ------------------
  const handleExport = () => {
    const payload = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setSelectedNode(null);
          setLogs((l) => l.concat('📥 Imported workflow from JSON.'));
        } else { alert('Invalid workflow file.'); }
      } catch { alert('Could not parse JSON.'); }
      finally { e.target.value = ''; }
    };
    reader.readAsText(file);
  };

  const handleImportPreset = () => {
    const preset = PRESETS.find((p) => p.name === selectedPreset); if (!preset) return;
    setNodes(preset.nodes);
    setEdges(preset.edges);
    setSelectedNode(null);
    setLogs((l) => l.concat(`✨ Loaded preset: ${preset.name}`));
  };

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setValidationErrors([]);
    setIsWorkflowBuilt(false);
    setLogs((l) => l.concat('🧹 Cleared workflow.'));
  };

  const handleDeleteSelected = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setLogs((l) => l.concat(`🗑️ Deleted node: ${selectedNode.data?.label || selectedNode.id}`));
    setSelectedNode(null);
  };

  // Local Storage - removed due to artifact restrictions
  const showConfig = useMemo(() => !!selectedNode, [selectedNode]);

  // ================== UI ==================
  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
        {/* Sidebar */}
        <div style={{ width: 260, padding: 16, background: '#f3f4f6', borderRight: '2px solid #90caf9' }}>
          <h3 style={{ marginBottom: 12, color: '#1e3a8a' }}>Components</h3>
          {componentTypes.map((comp) => (
            <div
              key={comp.type}
              title={comp.tip}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', comp.type);
                event.dataTransfer.effectAllowed = 'move';
              }}
              style={{ padding: '10px', margin: '8px 0', background: comp.color, borderRadius: 8, cursor: 'grab' }}
            >
              {comp.label}
            </div>
          ))}
          <hr />
          <h3 style={{ margin: '16px 0 8px', color: '#2b385eff' }}>Actions</h3>

          <button
            onClick={handleBuildStack}
            style={{ width: '100%', marginBottom: 6, background: '#3b82f6', color: 'white', borderRadius: 6, padding: 8 }}
          >
            Build Workflow
          </button>

          <button
            onClick={() => {
              if (!isWorkflowBuilt) { alert('Build the workflow first!'); return; }
              setChatOpen((o) => !o);
            }}
            style={{ width: '100%', marginBottom: 6, background: '#10b981', color: 'white', borderRadius: 6, padding: 8, cursor: isWorkflowBuilt ? 'pointer' : 'not-allowed' }}
            disabled={!isWorkflowBuilt}
          >
            Chat with Stack
          </button>

          <button
            onClick={handleExport}
            style={{ width: '100%', marginBottom: 6, background: '#6366f1', color: 'white', borderRadius: 6, padding: 8 }}
          >
            Export JSON
          </button>

          <button
            onClick={handleImportClick}
            style={{ width: '100%', marginBottom: 6, background: '#8b5cf6', color: 'white', borderRadius: 6, padding: 8 }}
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />

          <select
            style={{ width: '100%', marginBottom: 6, background: '#f3f4f6', color: '#1e3a8a', borderRadius: 6, padding: 8 }}
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            <option value="">Select Preset</option>
            {PRESETS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>

          <button
            onClick={handleImportPreset}
            style={{ width: '100%', marginBottom: 6, background: '#f59e0b', color: 'white', borderRadius: 6, padding: 8 }}
          >
            Load Preset
          </button>

          <button
            onClick={handleClear}
            style={{ width: '100%', marginBottom: 6, background: '#ef4444', color: 'white', borderRadius: 6, padding: 8 }}
          >
            Clear Workflow
          </button>

          <button
            onClick={handleDeleteSelected}
            style={{ width: '100%', marginBottom: 6, background: '#f97316', color: 'white', borderRadius: 6, padding: 8, cursor: selectedNode ? 'pointer' : 'not-allowed' }}
          >
            Delete Selected
          </button>

          {/* Execution Logs */}
          <div style={{ marginTop: 12, fontSize: 12, color: '#374151' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Execution Logs</div>
            <div style={{
              maxHeight: 160,
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 8,
            }}>
              {logs.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              {validationErrors.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {validationErrors.map((err, i) => (
                    <div key={`err-${i}`} style={{ color: '#dc2626' }}>⚠️ {err}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* React Flow */}
        <div
          ref={flowWrapperRef}
          style={{ flexGrow: 1, position: 'relative' }}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#b45454ff" gap={16} />
            <Controls />
            <MiniMap nodeColor={(n) => (n?.data?.color || '#cccccc')} />
          </ReactFlow>
        </div>

        {/* Enhanced Configuration Panel */}
        {showConfig && (
          <div style={{
            position: 'absolute', right: 0, top: 0, width: 420, height: '100%', 
            background: '#fafafa', borderLeft: '3px solid #3b82f6', padding: 20, 
            overflowY: 'auto', color: '#1e293b', borderRadius: '12px 0 0 12px', 
            boxShadow: '0 0 12px rgba(0,0,0,0.15)', zIndex: 11,
          }}>
            <h3 style={{ marginBottom: 16, color: '#1e40af', borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
              Configure: {selectedNode.data.label}
            </h3>

            {/* User Query Configuration */}
            {selectedNode.type === 'userQuery' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Query Text:</label>
                  <input
                    type="text"
                    value={selectedNode.data.queryText || ''}
                    onChange={(e) => updateNodeData('queryText', e.target.value)}
                    placeholder="Enter your question here..."
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Additional Points:</label>
                  <input
                    type="text"
                    value={selectedNode.data.points || ''}
                    onChange={(e) => updateNodeData('points', e.target.value)}
                    placeholder="Optional context or specific points to focus on"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
            )}

            {/* Enhanced Knowledge Base Configuration */}
            {selectedNode.type === 'knowledgeBase' && (
              <div>
                <EnhancedFileUpload
                  onFileUpload={(fileInfo) => {
                    const currentFiles = selectedNode.data.uploadedFiles || [];
                    updateNodeData('uploadedFiles', [...currentFiles, fileInfo]);
                    updateNodeData('file_path', fileInfo.path);
                    updateNodeData('file_name', fileInfo.name);
                  }}
                  uploadedFiles={selectedNode.data.uploadedFiles || []}
                  embeddingModel={selectedNode.data.embeddingModel}
                  updateNodeData={updateNodeData}
                />
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Collection Name (optional):</label>
                  <input
                    type="text"
                    value={selectedNode.data.collection_name || ''}
                    onChange={(e) => updateNodeData('collection_name', e.target.value)}
                    placeholder="Auto-generated if empty"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Chunk Size:</label>
                    <input
                      type="number"
                      value={selectedNode.data.chunk_size || 1000}
                      onChange={(e) => updateNodeData('chunk_size', parseInt(e.target.value))}
                      min="100"
                      max="4000"
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Chunk Overlap:</label>
                    <input
                      type="number"
                      value={selectedNode.data.chunk_overlap || 200}
                      onChange={(e) => updateNodeData('chunk_overlap', parseInt(e.target.value))}
                      min="0"
                      max="500"
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Embedding Model:</label>
                  <select
                    value={selectedNode.data.embeddingModel || 'text-embedding-3-large'}
                    onChange={(e) => updateNodeData('embeddingModel', e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                  >
                    <option value="text-embedding-3-large">OpenAI Embedding 3 Large</option>
                    <option value="text-embedding-3-small">OpenAI Embedding 3 Small</option>
                    <option value="text-embedding-ada-002">OpenAI Ada 002</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </div>
              </div>
            )}

            {/* Enhanced LLM Engine Configuration */}
            {selectedNode.type === 'llmEngine' && (
              <div>
                {/* Model Selection */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>LLM Model:</label>
                  <select
                    value={selectedNode.data.llmModel || 'gpt-4o-mini'}
                    onChange={(e) => updateNodeData('llmModel', e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                  >
                    <optgroup label="OpenAI Models">
                      <option value="gpt-4o">GPT-4o (Latest)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </optgroup>
                    <optgroup label="Google Models">
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </optgroup>
                  </select>
                </div>

                {/* Enhanced API Key Section */}
                <div style={{ 
                  background: '#eff6ff', 
                  border: '1px solid #bfdbfe', 
                  borderRadius: 8, 
                  padding: 16, 
                  marginBottom: 16 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 8 }}>🔑</span>
                      <strong style={{ color: '#1e40af' }}>API Key Configuration</strong>
                    </div>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#6b7280', 
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                      title={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? '👁️‍🗨️ Hide' : '👁️ Show'}
                    </button>
                  </div>
                  
                  <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>
                    {selectedNode.data.llmModel?.includes('gemini') ? 'Google AI API Key:' : 'OpenAI API Key:'}
                  </label>
                  
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={selectedNode.data.apiKey || ''}
                    onChange={(e) => updateNodeData('apiKey', e.target.value)}
                    placeholder={
                      selectedNode.data.llmModel?.includes('gemini') 
                        ? 'AIzaSy...' 
                        : 'sk-proj-... or sk-...'
                    }
                    style={{ 
                      width: '100%', 
                      padding: 8, 
                      borderRadius: 6, 
                      border: '1px solid #d1d5db',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  />
                  
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>
                    <div style={{ marginBottom: 2 }}>
                      <strong>Get your API key:</strong>{' '}
                      <a 
                        href={
                          selectedNode.data.llmModel?.includes('gemini') 
                            ? 'https://makersuite.google.com/app/apikey'
                            : 'https://platform.openai.com/api-keys'
                        }
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'underline' }}
                      >
                        {selectedNode.data.llmModel?.includes('gemini') ? 'Google AI Studio' : 'OpenAI Platform'}
                      </a>
                    </div>
                    <div>
                      <strong>Format:</strong> {
                        selectedNode.data.llmModel?.includes('gemini') 
                          ? 'Starts with AIzaSy'
                          : 'Starts with sk-'
                      }
                    </div>
                  </div>
                  
                  {/* API Key Status */}
                  {selectedNode.data.apiKey && (
                    <div style={{ 
                      marginTop: 8, 
                      padding: 6, 
                      backgroundColor: selectedNode.data.apiKey.length > 20 ? '#dcfce7' : '#fef3c7',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      border: selectedNode.data.apiKey.length > 20 ? '1px solid #bbf7d0' : '1px solid #fde047'
                    }}>
                      {selectedNode.data.apiKey.length > 20 ? '✅ API key provided' : '⚠️ API key seems incomplete'}
                    </div>
                  )}
                </div>

                {/* Environment Variable Alternative */}
                <div style={{ 
                  background: '#fefce8', 
                  border: '1px solid #fde047', 
                  borderRadius: 8, 
                  padding: 12, 
                  marginBottom: 16,
                  fontSize: '0.875rem'
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 4, color: '#a16207' }}>
                    💡 Alternative: Environment Variable
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
                    Set{' '}
                    <code style={{ background: '#fbbf24', padding: '2px 4px', borderRadius: 2 }}>
                      {selectedNode.data.llmModel?.includes('gemini') ? 'REACT_APP_GOOGLE_API_KEY' : 'REACT_APP_OPENAI_API_KEY'}
                    </code>
                    {' '}in your .env file
                  </div>
                </div>

                {/* System Prompt */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>System Prompt:</label>
                  <textarea
                    value={selectedNode.data.prompt || ''}
                    onChange={(e) => updateNodeData('prompt', e.target.value)}
                    placeholder="You are a helpful assistant. Answer questions based on the provided context..."
                    style={{ 
                      width: '100%', 
                      height: 80, 
                      padding: 8, 
                      borderRadius: 6, 
                      border: '1px solid #d1d5db',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Temperature */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Temperature: {selectedNode.data.temperature ?? 0.7}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={selectedNode.data.temperature ?? 0.7}
                    onChange={(e) => updateNodeData('temperature', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    marginTop: 4
                  }}>
                    <span>Focused (0)</span>
                    <span>Balanced (1)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                {/* Advanced Settings */}
                <details style={{ marginBottom: 16 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 500, color: '#1e40af', marginBottom: 8 }}>
                    Advanced Settings
                  </summary>
                  
                  <div style={{ paddingLeft: 8 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>Max Tokens:</label>
                      <input
                        type="number"
                        value={selectedNode.data.maxTokens || 1000}
                        onChange={(e) => updateNodeData('maxTokens', parseInt(e.target.value))}
                        min="1"
                        max="4096"
                        style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>
                        Top P: {selectedNode.data.topP ?? 1.0}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedNode.data.topP ?? 1.0}
                        onChange={(e) => updateNodeData('topP', parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>
                        Frequency Penalty: {selectedNode.data.frequencyPenalty ?? 0}
                      </label>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={selectedNode.data.frequencyPenalty ?? 0}
                        onChange={(e) => updateNodeData('frequencyPenalty', parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>
                        Presence Penalty: {selectedNode.data.presencePenalty ?? 0}
                      </label>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={selectedNode.data.presencePenalty ?? 0}
                        onChange={(e) => updateNodeData('presencePenalty', parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </details>

                {/* Configuration Summary */}
                <div style={{ 
                  background: selectedNode.data.apiKey && selectedNode.data.prompt ? '#dcfce7' : '#fef3c7',
                  border: selectedNode.data.apiKey && selectedNode.data.prompt ? '1px solid #bbf7d0' : '1px solid #fde047',
                  borderRadius: 8, 
                  padding: 12,
                  fontSize: '0.875rem'
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 6 }}>Configuration Status:</div>
                  <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                    <div style={{ color: selectedNode.data.llmModel ? '#16a34a' : '#d97706', marginBottom: 2 }}>
                      • Model: {selectedNode.data.llmModel ? '✓' : '⚠'} {selectedNode.data.llmModel || 'Not selected'}
                    </div>
                    <div style={{ color: selectedNode.data.apiKey ? '#16a34a' : '#d97706', marginBottom: 2 }}>
                      • API Key: {selectedNode.data.apiKey ? '✓ Provided' : '⚠ Required'}
                    </div>
                    <div style={{ color: selectedNode.data.prompt ? '#16a34a' : '#d97706' }}>
                      • Prompt: {selectedNode.data.prompt ? '✓ Set' : '⚠ Required'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Output Configuration */}
            {selectedNode.type === 'output' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Chat Title:</label>
                  <input
                    type="text"
                    value={selectedNode.data.title || ''}
                    onChange={(e) => updateNodeData('title', e.target.value)}
                    placeholder="Optional title for the output"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedNode.data.allowFollowUp || false}
                      onChange={(e) => updateNodeData('allowFollowUp', e.target.checked)}
                      style={{ marginRight: 8 }}
                    />
                    <span style={{ fontWeight: 500 }}>Allow Follow-up Questions</span>
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Output Text:</label>
                  <textarea
                    readOnly
                    value={selectedNode.data.outputText || 'No output yet. Run the workflow to see results.'}
                    style={{ 
                      width: '100%', 
                      height: 150, 
                      padding: 8, 
                      borderRadius: 6, 
                      border: '1px solid #d1d5db',
                      background: '#f9fafb',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Modal */}
        {chatOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}>
            <div style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              width: '90%',
              maxWidth: 600,
              height: '80%',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: '#1e40af' }}>Chat with Your Workflow</h3>
                <button
                  onClick={() => setChatOpen(false)}
                  style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '8px 12px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                {chatLog.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                    Start a conversation by typing your question below
                  </div>
                ) : (
                  chatLog.map((chat, idx) => (
                    <div key={idx} style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: 4 }}>You:</div>
                      <div style={{ background: '#f3f4f6', padding: 8, borderRadius: 6, marginBottom: 8 }}>{chat.user}</div>
                      <div style={{ fontWeight: 'bold', color: '#059669', marginBottom: 4 }}>Assistant:</div>
                      <div style={{ background: '#f0fdf4', padding: 8, borderRadius: 6, border: '1px solid #bbf7d0' }}>
                        {chat.bot === '...' ? <span style={{ fontStyle: 'italic' }}>Thinking...</span> : chat.bot}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  style={{ flex: 1, padding: 12, border: '1px solid #d1d5db', borderRadius: 6 }}
                  disabled={isSending}
                />
                <button
                  onClick={handleSend}
                  disabled={!query.trim() || isSending}
                  style={{ 
                    background: '#3b82f6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '12px 24px', 
                    cursor: !query.trim() || isSending ? 'not-allowed' : 'pointer',
                    opacity: !query.trim() || isSending ? 0.5 : 1
                  }}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}

export default App;






