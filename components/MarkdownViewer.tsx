
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
    filePath: string;
}

const MarkdownViewer = ({ filePath }: MarkdownViewerProps) => {
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load markdown file: ${response.statusText}`);
                }
                return response.text();
            })
            .then(text => {
                setMarkdown(text);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('לא ניתן היה לטעון את התוכן.');
                setLoading(false);
            });
    }, [filePath]);

    if (loading) {
        return <div className="text-center p-4">טוען...</div>;
    }

    if (error) {
        return <div className="text-center p-4 text-red-500">{error}</div>;
    }

    return (
        <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
                h4: ({node, ...props}) => <h4 className="font-semibold text-gray-800 mt-4 mb-2" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-700" {...props} />,
            }}
        >
            {markdown}
        </ReactMarkdown>
    );
};

export default MarkdownViewer;
