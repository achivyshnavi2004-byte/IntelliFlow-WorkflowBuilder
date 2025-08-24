import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = memo(({ id, data, type }) => {
  const getNodeStyle = (nodeType) => {
    const baseStyle = {
      padding: '12px',
      borderRadius: '12px',
      minWidth: '180px',
      minHeight: '80px',
      border: '2px solid',
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    };

    const styles = {
      userQuery: {
        ...baseStyle,
        background: '#FFCDD2',
        borderColor: '#F44336',
      },
      knowledgeBase: {
        ...baseStyle,
        background: '#C8E6C9', 
        borderColor: '#4CAF50',
      },
      llmEngine: {
        ...baseStyle,
        background: '#BBDEFB',
        borderColor: '#2196F3', 
      },
      output: {
        ...baseStyle,
        background: '#FFF9C4',
        borderColor: '#FFEB3B',
      }
    };
    return styles[nodeType] || styles.userQuery;
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('node_id', id);
      
      const response = await fetch('http://localhost:8000/process_file', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        console.log('✅ File processed successfully:', result.message);
        // Optionally update node data to reflect successful upload
      } else {
        console.error('❌ File processing failed:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ File upload failed:', error);
    }
  };

  const renderNodeContent = () => {
    switch (type) {
      case 'userQuery':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#c62828'
            }}>
              📝 User Query
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              <strong>Query:</strong> {data.queryText ? 
                (data.queryText.length > 30 ? data.queryText.substring(0, 30) + '...' : data.queryText) 
                : 'Not set'}
            </div>
            <div style={{ fontSize: '10px', color: '#888' }}>
              <strong>Points:</strong> {data.points || 'None'}
            </div>
            {!data.queryText && (
              <div style={{ fontSize: '9px', color: '#f44336', marginTop: '4px' }}>
                ⚠️ Query text required
              </div>
            )}
          </div>
        );

      case 'knowledgeBase':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#2e7d32'
            }}>
              📄 Knowledge Base
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                style={{ 
                  fontSize: '9px', 
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
              <strong>Model:</strong> {data.embeddingModel === 'text-embedding-3-large' ? 'OpenAI Large' : 
                                      data.embeddingModel === 'gemini' ? 'Gemini' : 'OpenAI Large'}
            </div>
            
            <div style={{ fontSize: '9px', color: data.file ? '#2e7d32' : '#ff9800' }}>
              {data.file ? '✅ File uploaded' : '📁 No file selected'}
            </div>
            
            {!data.file && (
              <div style={{ fontSize: '9px', color: '#f44336', marginTop: '2px' }}>
                ⚠️ File required for KB
              </div>
            )}
          </div>
        );

      case 'llmEngine':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#1565c0'
            }}>
              🤖 LLM Engine
            </div>
            
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>
              <strong>Model:</strong> {data.llmModel || 'GPT-4'}
            </div>
            
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>
              <strong>Temp:</strong> {data.temperature ?? 0.7}
            </div>
            
            <div style={{ fontSize: '9px', color: '#666', marginBottom: '3px' }}>
              {data.webSearchTool === 'SerpAPI' ? '🔍 Web search ON' : '🔍 Web search OFF'}
            </div>
            
            <div style={{ fontSize: '9px', color: data.apiKey ? '#2e7d32' : '#f44336' }}>
              {data.apiKey ? '✅ API key configured' : '⚠️ No API key'}
            </div>
            
            <div style={{ fontSize: '9px', color: data.prompt ? '#2e7d32' : '#ff9800', marginTop: '2px' }}>
              {data.prompt ? '✅ Custom prompt set' : '📝 Default prompt'}
            </div>
            
            {(!data.apiKey || !data.prompt) && (
              <div style={{ fontSize: '8px', color: '#f44336', marginTop: '4px' }}>
                ⚠️ API key & prompt required
              </div>
            )}
          </div>
        );

      case 'output':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#f57f17'
            }}>
              💬 Output
            </div>
            
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>
              <strong>Title:</strong> {data.title || 'Chat Output'}
            </div>
            
            <div style={{ fontSize: '9px', color: '#666', marginBottom: '6px' }}>
              Follow-ups: {data.allowFollowUp ? 'Enabled' : 'Disabled'}
            </div>
            
            <div style={{ 
              fontSize: '9px', 
              color: '#333',
              maxHeight: '50px',
              overflowY: 'auto',
              background: 'rgba(255,255,255,0.7)',
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              wordBreak: 'break-word'
            }}>
              {data.outputText ? 
                (data.outputText.length > 100 ? 
                  data.outputText.substring(0, 100) + '...' : 
                  data.outputText) 
                : '⏳ Awaiting response...'}
            </div>
          </div>
        );

      default:
        return (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
              ❓ Unknown Node
            </div>
            <div style={{ fontSize: '10px', color: '#999' }}>
              Type: {type}
            </div>
          </div>
        );
    }
  };

  return (
    <div style={getNodeStyle(type)}>
      {/* Input Handle - all nodes except userQuery can receive input */}
      {type !== 'userQuery' && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: '#333',
            width: '10px',
            height: '10px',
            border: '2px solid #fff',
            borderRadius: '50%'
          }}
        />
      )}
      
      {/* Output Handle - all nodes except output can send output */}
      {type !== 'output' && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: '#333',
            width: '10px',
            height: '10px',
            border: '2px solid #fff',
            borderRadius: '50%'
          }}
        />
      )}
      
      {/* Node Content */}
      {renderNodeContent()}
      
      {/* Node ID Badge */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        background: '#333',
        color: 'white',
        fontSize: '8px',
        padding: '2px 6px',
        borderRadius: '10px',
        fontFamily: 'monospace',
        border: '1px solid #fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }}>
        {id}
      </div>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;








