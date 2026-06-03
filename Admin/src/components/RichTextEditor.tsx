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

  // Helper to clean up pasted HTML content by preserving formatting tags but stripping styles and classes
  const cleanPastedHtml = (htmlString: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      
      const cleanNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent
            ? node.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            : '';
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();
          
          const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'u', 'span', 'br', 'a'];
          if (!allowedTags.includes(tagName)) {
            let childrenHtml = '';
            for (let i = 0; i < el.childNodes.length; i++) {
              childrenHtml += cleanNode(el.childNodes[i]);
            }
            return childrenHtml;
          }
          
          if (tagName === 'span') {
            let childrenHtml = '';
            for (let i = 0; i < el.childNodes.length; i++) {
              childrenHtml += cleanNode(el.childNodes[i]);
            }
            return childrenHtml;
          }
          
          let attrStr = '';
          if (tagName === 'a') {
            const href = el.getAttribute('href');
            if (href) {
              attrStr = ` href="${href}" target="_blank" rel="noopener noreferrer"`;
            }
          }
          
          let childrenHtml = '';
          for (let i = 0; i < el.childNodes.length; i++) {
            childrenHtml += cleanNode(el.childNodes[i]);
          }
          
          if (tagName === 'br') {
            return '<br>';
          }
          
          return `<${tagName}${attrStr}>${childrenHtml}</${tagName}>`;
        }
        
        return '';
      };
      
      let result = '';
      const body = doc.body;
      for (let i = 0; i < body.childNodes.length; i++) {
        result += cleanNode(body.childNodes[i]);
      }
      return result;
    } catch (e) {
      console.error('Error cleaning pasted HTML:', e);
      return htmlString;
    }
  };

  // Custom paste handler to clean up styles while preserving structure/formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    
    // Check word count limit
    const pastedWordCount = getWordCount(text);
    if (maxLength && (wordCount + pastedWordCount) > maxLength) {
      alert(`Cannot paste: the content exceeds the maximum limit of ${maxLength} words.`);
      return;
    }

    let contentToInsert = '';
    if (html) {
      contentToInsert = cleanPastedHtml(html);
    } else if (text) {
      // Convert plain text newlines into clean paragraph elements
      contentToInsert = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .split(/\r?\n/)
        .map(line => line.trim() ? `<p>${line}</p>` : '<br>')
        .join('');
    }

    if (contentToInsert) {
      document.execCommand('insertHTML', false, contentToInsert);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
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
