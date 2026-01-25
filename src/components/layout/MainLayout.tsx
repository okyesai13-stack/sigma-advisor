
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MainLayoutProps {
    children: React.ReactNode;
    pageTitle: string;
}

const MainLayout = ({ children, pageTitle }: MainLayoutProps) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="container max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-foreground">{pageTitle}</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
