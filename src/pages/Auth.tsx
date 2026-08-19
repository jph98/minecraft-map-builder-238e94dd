import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pickaxe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleGoogle = async () => {
    setSigningIn(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setSigningIn(false);
      toast.error('Could not sign in with Google. Please try again.');
      return;
    }
    if (result.redirected) return;
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <Pickaxe className="w-8 h-8 text-gray-600" />
          </div>
          <CardTitle className="text-2xl">Minecraft Map Builder</CardTitle>
          <CardDescription>Sign in to create and save your maps</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleGoogle} disabled={signingIn}>
            {signingIn ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;