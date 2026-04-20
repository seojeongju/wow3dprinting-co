'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Youtube } from '@tiptap/extension-youtube';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import { Video } from '@/lib/tiptap-extensions/Video';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Quote, 
  Minus, 
  MapPin, 
  Link as LinkIcon, 
  Table as TableIcon, 
  Code, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered,
  Trash2,
  Maximize,
  Type,
  ChevronDown,
  RotateCcw,
  RotateCw,
  Undo,
  Redo
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(content);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-6 space-y-2',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-6 space-y-2',
          },
        },
        heading: {
          HTMLAttributes: {
            class: 'font-black italic tracking-tighter uppercase leading-tight mt-8 mb-4 hover:text-primary transition-colors',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary pl-6 py-4 my-8 bg-primary/5 rounded-r-3xl italic text-xl font-medium text-gray-700',
          },
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-[2.5rem] shadow-2xl mx-auto my-12 border-8 border-white ring-1 ring-black/5 hover:scale-[1.02] transition-transform duration-500',
        },
      }),
      Video.configure({
        HTMLAttributes: {
          class: 'rounded-[2.5rem] shadow-2xl mx-auto my-12 border-8 border-white ring-1 ring-black/5',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary font-bold underline underline-offset-4 decoration-2 hover:decoration-primary/40 transition-all',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image', 'video'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-8 bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        width: 840,
        height: 480,
        HTMLAttributes: {
          class: 'rounded-[2.5rem] shadow-2xl mx-auto my-12 aspect-video w-full border-8 border-white ring-1 ring-black/5',
        },
      }),
      Placeholder.configure({
        placeholder: '당신의 멋진 기사를 이곳에 작성하세요...',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-gray-300 before:absolute before:pointer-events-none',
      }),
      Underline,
      Highlight,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setHtmlContent(html);
    },
  });

  // 초기 콘텐츠 동기화
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const addVideo = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/assets', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json() as any;
      if (data.success) {
        if (file.type.startsWith('image/')) {
          editor.chain().focus().setImage({ src: data.url }).run();
        } else if (file.type.startsWith('video/')) {
          editor.chain().focus().setVideo({ src: data.url }).run();
        }
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert('파일 업로드 중 오류가 발생했습니다.');
    }
    e.target.value = '';
  };

  const addYoutubeVideo = useCallback(() => {
    const url = prompt('유튜브 URL을 입력하세요:');
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('URL을 입력하세요:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-[2.5rem] overflow-hidden bg-white shadow-2xl transition-all duration-700 hover:shadow-primary/5">
      {/* Naver Style Top Toolbar Level 1 */}
      <div className="bg-muted px-8 py-6 border-b flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <ToolbarButton onClick={addImage} icon={<ImageIcon className="w-6 h-6" />} label="사진" />
          <ToolbarButton onClick={addVideo} icon={<VideoIcon className="w-6 h-6" />} label="동영상" />
          <ToolbarButton onClick={addYoutubeVideo} icon={<VideoIcon className="w-6 h-6 text-red-500" />} label="유튜브" />
          <div className="h-10 w-px bg-gray-200 mx-2" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<Quote className="w-6 h-6" />} label="인용구" active={editor.isActive('blockquote')} />
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus className="w-6 h-6" />} label="구분선" />
          <ToolbarButton onClick={() => {}} icon={<MapPin className="w-6 h-6" />} label="장소" />
          <ToolbarButton onClick={setLink} icon={<LinkIcon className="w-6 h-6" />} label="링크" active={editor.isActive('link')} />
          <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={<TableIcon className="w-6 h-6" />} label="표" />
          <ToolbarButton onClick={() => setIsHtmlMode(!isHtmlMode)} icon={<Code className="w-6 h-6" />} label="HTML" active={isHtmlMode} />
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => editor.chain().focus().undo().run()} className="p-3 hover:bg-white rounded-2xl transition-all"><Undo className="w-5 h-5 text-gray-500" /></button>
          <button onClick={() => editor.chain().focus().redo().run()} className="p-3 hover:bg-white rounded-2xl transition-all"><Redo className="w-5 h-5 text-gray-500" /></button>
        </div>
      </div>

      {/* Formatting Toolbar Level 2 */}
      <div className="bg-white px-8 py-4 border-b flex items-center gap-4 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="flex items-center bg-gray-50 rounded-2xl p-1 gap-1">
          <FormatButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} label="T1" />
          <FormatButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="T2" />
          <FormatButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="T3" />
        </div>
        
        <div className="h-6 w-px bg-gray-200" />
        
        <div className="flex items-center gap-1">
          <IconButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={<Bold className="w-4 h-4" />} />
          <IconButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={<Italic className="w-4 h-4" />} />
          <IconButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={<UnderlineIcon className="w-4 h-4" />} />
          <IconButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} icon={<Strikethrough className="w-4 h-4" />} />
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-1">
          <IconButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} icon={<AlignLeft className="w-4 h-4" />} />
          <IconButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} icon={<AlignCenter className="w-4 h-4" />} />
          <IconButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} icon={<AlignRight className="w-4 h-4" />} />
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-1">
          <IconButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={<List className="w-4 h-4" />} />
          <IconButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={<ListOrdered className="w-4 h-4" />} />
        </div>
      </div>

      <div className="relative">
        {/* HTML Source Mode */}
        {isHtmlMode && (
          <textarea
            className="absolute inset-0 z-20 w-full h-full p-10 font-mono text-sm bg-gray-900 text-green-400 focus:outline-none resize-none"
            value={htmlContent}
            onChange={(e) => {
              setHtmlContent(e.target.value);
              editor.commands.setContent(e.target.value);
            }}
          />
        )}

        {/* Bubble Menu for Images/Videos */}
        {editor && (
          <BubbleMenu editor={editor} shouldShow={({ editor }) => editor.isActive('image') || editor.isActive('video')} tippyOptions={{ duration: 100 }}>
            <div className="bg-white border shadow-2xl rounded-2xl flex items-center p-2 gap-2 backdrop-blur-xl bg-white/90">
              <button 
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-3 rounded-xl transition-all ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary text-white shadow-lg' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <AlignLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-3 rounded-xl transition-all ${editor.isActive({ textAlign: 'center' }) ? 'bg-primary text-white shadow-lg' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <AlignCenter className="w-5 h-5" />
              </button>
              <button 
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-3 rounded-xl transition-all ${editor.isActive({ textAlign: 'right' }) ? 'bg-primary text-white shadow-lg' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <AlignRight className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <button className="p-3 hover:bg-gray-100 rounded-xl transition-all"><Maximize className="w-5 h-5 text-gray-500" /></button>
              <button onClick={() => editor.chain().focus().deleteSelection().run()} className="p-3 hover:bg-red-50 rounded-xl transition-all text-red-500"><Trash2 className="w-5 h-5" /></button>
            </div>
          </BubbleMenu>
        )}

        {/* Editor Content Area */}
        <div className="p-10 md:p-20 min-h-[800px] prose prose-lg prose-zinc max-w-none focus:outline-none bg-gray-50/10">
          <EditorContent editor={editor} className="min-h-[600px] outline-none" />
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
      
      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap:focus {
          outline: none;
        }
        .tiptap table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .tiptap table td, .tiptap table th {
          min-width: 1em;
          border: 2px solid #ced4da;
          padding: 3px 5px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .tiptap table th {
          font-weight: bold;
          text-align: left;
          background-color: #f8f9fa;
        }
        .tiptap table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
        .tiptap table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #adf;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

function ToolbarButton({ onClick, icon, label, active = false }: { onClick: () => void, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all group ${active ? 'text-primary scale-110' : 'text-gray-600 hover:text-primary hover:scale-110'}`}
    >
      <div className={`p-4 rounded-[1.25rem] transition-all shadow-sm ${active ? 'bg-primary text-white shadow-primary/30' : 'bg-white group-hover:bg-primary/5'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">{label}</span>
    </button>
  );
}

function FormatButton({ onClick, active, label }: { onClick: () => void, active: boolean, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-transparent text-gray-500 hover:bg-white hover:text-primary'}`}
    >
      {label}
    </button>
  );
}

function IconButton({ onClick, active, icon }: { onClick: () => void, active: boolean, icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all ${active ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
    >
      {icon}
    </button>
  );
}
