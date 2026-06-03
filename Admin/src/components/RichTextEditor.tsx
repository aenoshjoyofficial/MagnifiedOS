import React, { useRef, useEffect } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Divider, Typography } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatClearIcon from '@mui/icons-material/FormatClear';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  maxLength?: number;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, onBlur, maxLength = 1000, placeholder = 'Write lesson description...' }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Update innerHTML only when value changes externally (not during active typing)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleCommand = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If editor becomes empty, Supabase will save empty string
      const finalHtml = html === '<br>' || html === '' ? '' : html;
      onChange(finalHtml);
    }
  };

  // Helper to strip HTML tags and calculate exact words
  const getWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  };

  const wordCount = getWordCount(value);

  // Prevent further typing when word count meets or exceeds the limit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (maxLength && wordCount >= maxLength && e.key !== 'Backspace' && e.key !== 'Delete' && !e.metaKey && !e.ctrlKey) {
      const selection = window.getSelection();
      // If there is no text selected (i.e. not replacing text), block typing
      if (selection && selection.toString().length === 0) {
        e.preventDefault();
      }
    }
  };

  // Custom paste handler to strip styling and enforce word limit
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const words = text.trim().split(/\s+/);
    const wordsLeft = maxLength - wordCount;
    
    if (wordsLeft <= 0) return;
    
    const textToInsert = words.slice(0, wordsLeft).join(' ');
    document.execCommand('insertText', false, textToInsert);
  };

  return (
    <Box 
      sx={{ 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: 2, 
        overflow: 'hidden',
        backgroundColor: '#030712',
        '&:focus-within': {
          borderColor: 'var(--emerald-primary)'
        }
      }}
    >
      {/* Toolbar */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 0.5, 
          gap: 0.5, 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
          backgroundColor: 'rgba(255, 255, 255, 0.02)' 
        }}
      >
        <ToggleButtonGroup size="small" aria-label="text formatting">
          <ToggleButton value="bold" onClick={() => handleCommand('bold')} title="Bold">
            <FormatBoldIcon fontSize="small" sx={{ color: '#EAEAEA' }} />
          </ToggleButton>
          <ToggleButton value="italic" onClick={() => handleCommand('italic')} title="Italic">
            <FormatItalicIcon fontSize="small" sx={{ color: '#EAEAEA' }} />
          </ToggleButton>
          <ToggleButton value="underlined" onClick={() => handleCommand('underline')} title="Underline">
            <FormatUnderlinedIcon fontSize="small" sx={{ color: '#EAEAEA' }} />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <ToggleButtonGroup size="small" aria-label="headings">
          <ToggleButton value="h2" onClick={() => handleCommand('formatBlock', '<h2>')} title="Heading (H2)" sx={{ px: 1.5, minWidth: 32, fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37' }}>
            H2
          </ToggleButton>
          <ToggleButton value="h3" onClick={() => handleCommand('formatBlock', '<h3>')} title="Subheading (H3)" sx={{ px: 1.5, minWidth: 32, fontSize: '0.75rem', fontWeight: 800, color: '#EAEAEA' }}>
            H3
          </ToggleButton>
          <ToggleButton value="p" onClick={() => handleCommand('formatBlock', '<p>')} title="Paragraph" sx={{ px: 1.5, minWidth: 32, fontSize: '0.75rem', fontWeight: 800, color: '#B0B0B0' }}>
            P
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <ToggleButtonGroup size="small" aria-label="lists">
          <ToggleButton value="list-bullet" onClick={() => handleCommand('insertUnorderedList')} title="Bullet List">
            <FormatListBulletedIcon fontSize="small" sx={{ color: '#EAEAEA' }} />
          </ToggleButton>
          <ToggleButton value="list-number" onClick={() => handleCommand('insertOrderedList')} title="Numbered List">
            <FormatListNumberedIcon fontSize="small" sx={{ color: '#EAEAEA' }} />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <ToggleButton value="clear" size="small" onClick={() => handleCommand('removeFormat')} title="Clear Formatting">
          <FormatClearIcon fontSize="small" sx={{ color: '#EAEAEA' }} />
        </ToggleButton>
      </Box>

      {/* Editor Body */}
      <Box
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        sx={{
          minHeight: 120,
          maxHeight: 300,
          overflowY: 'auto',
          p: 1.5,
          color: '#EAEAEA',
          outline: 'none',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          position: 'relative',
          '&:empty:before': {
            content: 'attr(data-placeholder)',
            color: 'rgba(255, 255, 255, 0.3)',
            position: 'absolute',
            left: 12,
            top: 12,
            pointerEvents: 'none'
          },
          '& h2': {
            fontSize: '1.2rem',
            fontWeight: 800,
            color: '#D4AF37',
            marginTop: '12px',
            marginBottom: '6px',
            fontFamily: 'Outfit, sans-serif'
          },
          '& h3': {
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#EAEAEA',
            marginTop: '10px',
            marginBottom: '4px',
            fontFamily: 'Outfit, sans-serif'
          },
          '& ul, & ol': {
            paddingLeft: '20px',
            margin: '8px 0',
          },
          '& p': {
            margin: '8px 0',
          }
        }}
      />

      {/* Word Count Indicator */}
      <Box 
        sx={{ 
          p: 1, 
          backgroundColor: 'rgba(255, 255, 255, 0.01)', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
          display: 'flex', 
          justifyContent: 'flex-end' 
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            color: wordCount > maxLength ? 'error.main' : 'rgba(255, 255, 255, 0.4)',
            fontWeight: wordCount > maxLength ? 700 : 400
          }}
        >
          {wordCount} / {maxLength} words
        </Typography>
      </Box>
    </Box>
  );
};

export default RichTextEditor;
