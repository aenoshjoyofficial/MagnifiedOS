import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Stack, 
  IconButton, 
  Alert, 
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  CheckCircle, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  validateWorkbook, 
  compileWorkbook, 
  saveCompiledProgramToLocalStorage,
  ProgramJSON
} from '../../lib/programCompiler';

interface ProgramImportModalProps {
  open: boolean;
  onClose: () => void;
  programId: string | null;
  onImportSuccess: (compiledData: ProgramJSON) => void;
}

export const ProgramImportModal: React.FC<ProgramImportModalProps> = ({
  open,
  onClose,
  programId,
  onImportSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [compiledData, setCompiledData] = useState<ProgramJSON | null>(null);
  const [success, setSuccess] = useState(false);

  const resetState = () => {
    setFile(null);
    setValidationErrors([]);
    setCompiledData(null);
    setSuccess(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'csv') {
        processFile(droppedFile);
      } else {
        setValidationErrors(['Invalid File Type: Only .xlsx and .csv files are supported.']);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFile = (selectedFile: File) => {
    resetState();
    setFile(selectedFile);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          setValidationErrors(['Could not read file data.']);
          setLoading(false);
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 1. Run Validation
        const errors = validateWorkbook(workbook);
        if (errors.length > 0) {
          setValidationErrors(errors);
          setLoading(false);
          return;
        }

        // 2. Run Compilation
        const program = compileWorkbook(workbook);
        setCompiledData(program);
      } catch (err: any) {
        console.error('Error processing Excel file:', err);
        setValidationErrors([`File Parsing Failed: ${err.message || 'Check spreadsheet values and columns format.'}`]);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setValidationErrors(['Error reading file.']);
      setLoading(false);
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleCompile = () => {
    if (!programId || !compiledData) return;

    try {
      setLoading(true);
      
      // 3. Write to LocalStorage Scoped Keys
      saveCompiledProgramToLocalStorage(programId, compiledData);
      
      setSuccess(true);
      setTimeout(() => {
        onImportSuccess(compiledData);
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to compile and write locally:', err);
      setValidationErrors([`Storage Write Failed: ${err.message || 'Could not populate local settings.'}`]);
      setLoading(false);
    }
  };

  // Calculate task count for preview
  const getTaskCount = (): number => {
    if (!compiledData) return 0;
    let count = 0;
    compiledData.modules.forEach(m => {
      m.lessons.forEach(l => {
        count += l.tasks.length;
      });
    });
    return count;
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: '#121217',
            border: '1px solid var(--emerald-mid)',
            borderRadius: 3,
            color: '#EAEAEA'
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, pb: 1 }}>
        <Typography variant="h6" sx={{ color: 'var(--emerald-primary)', fontWeight: 800 }}>
          Import Program Excel
        </Typography>
        {!loading && (
          <IconButton onClick={handleClose} sx={{ color: '#666', '&:hover': { color: '#B0B0B0' } }}>
            <X size={20} />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', py: 3 }}>
        {!programId ? (
          <Alert severity="warning" sx={{ backgroundColor: 'rgba(239, 83, 80, 0.05)', color: '#EF5350', border: '1px solid rgba(239, 83, 80, 0.2)' }}>
            <strong>Active Program Required:</strong> Please select or save a program in General Settings before importing. We need a valid Program ID to map Chamber script storage scoped keys.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {/* File Drop Target */}
            {!file && !loading && (
              <Box
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                sx={{
                  border: dragActive ? '2px dashed var(--emerald-primary)' : '2px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  p: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: dragActive ? 'var(--emerald-mid)' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'var(--emerald-primary)',
                    backgroundColor: 'rgba(16, 185, 129, 0.03)'
                  }
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                />
                <Upload size={40} color="#666" style={{ marginBottom: 12 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Drag & Drop Excel file
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  or click to select from your files (.xlsx, .csv)
                </Typography>
              </Box>
            )}

            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress sx={{ color: 'var(--emerald-primary)' }} />
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                  Processing and validating workbook...
                </Typography>
              </Box>
            )}

            {/* Validation Errors Panel */}
            {validationErrors.length > 0 && (
              <Box sx={{ border: '1px solid rgba(244, 67, 54, 0.3)', backgroundColor: 'rgba(244, 67, 54, 0.03)', borderRadius: 2, p: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mb: 1.5 }}>
                  <AlertTriangle size={18} color="#f44336" style={{ marginTop: 2 }} />
                  <Typography variant="subtitle2" sx={{ color: '#f44336', fontWeight: 800 }}>
                    Validation Failed ({validationErrors.length} Errors)
                  </Typography>
                </Stack>
                <Box sx={{ maxHeight: 150, overflowY: 'auto', pr: 1 }}>
                  <Stack spacing={0.5}>
                    {validationErrors.map((err, i) => (
                      <Typography key={i} variant="caption" sx={{ color: '#B0B0B0', display: 'block', fontFamily: 'monospace' }}>
                        • {err}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={resetState} 
                  sx={{ mt: 2, color: '#f44336', borderColor: 'rgba(244, 67, 54, 0.3)', '&:hover': { borderColor: '#f44336' } }}
                >
                  Clear and Retry
                </Button>
              </Box>
            )}

            {/* Success Success Panel */}
            {success && (
              <Box sx={{ border: '1px solid rgba(76, 175, 80, 0.3)', backgroundColor: 'rgba(76, 175, 80, 0.03)', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <CheckCircle size={48} color="#4CAF50" style={{ margin: '0 auto 12px' }} />
                <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 800, mb: 0.5 }}>
                  Program Compiled Successfully
                </Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                  Scoping localStorage scripts created. Updating parent workspace layout...
                </Typography>
              </Box>
            )}

            {/* Preview Sheet Panel */}
            {compiledData && !success && (
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#D4AF37', fontWeight: 800, mb: 2, fontSize: '0.75rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                  FILE LOADED: {file?.name}
                </Typography>
                <Paper sx={{ p: 3, border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>PROGRAM TITLE</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'var(--emerald-primary)' }}>
                        {compiledData.metadata.title || 'Untitled Program'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>DESCRIPTION</Typography>
                      <Typography variant="body2" sx={{ color: '#B0B0B0', fontStyle: 'italic', maxLines: 2, overflow: 'hidden' }}>
                        {compiledData.metadata.description || 'No description provided.'}
                      </Typography>
                    </Box>
                    <Divider sx={{ opacity: 0.05 }} />
                    <Stack direction="row" spacing={4}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>CHAMBER MODULES</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {compiledData.modules.length}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>TOTAL DAYS (LESSONS)</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {compiledData.metadata.duration_days}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>TASKS GENERATED</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {getTaskCount()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
                <Button 
                  size="small"
                  variant="text" 
                  onClick={resetState} 
                  sx={{ mt: 1, color: '#666', '&:hover': { color: '#B0B0B0' }, textTransform: 'none' }}
                >
                  Upload different file
                </Button>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ color: '#B0B0B0' }}
        >
          Cancel
        </Button>
        {compiledData && !success && programId && (
          <Button 
            variant="contained" 
            onClick={handleCompile}
            disabled={loading}
            sx={{ 
              backgroundColor: 'var(--emerald-primary)', 
              color: '#0B0B0F', 
              fontWeight: 700,
              '&:hover': { backgroundColor: 'var(--emerald-light)' }
            }}
          >
            Compile Program
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
