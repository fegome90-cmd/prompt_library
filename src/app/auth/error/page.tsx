'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * AuthErrorContent - Component that uses useSearchParams
 * Must be wrapped in Suspense boundary for Next.js 16
 */
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Error de configuración del servidor.';
      case 'AccessDenied':
        return 'Acceso denegado. No tienes permisos para acceder.';
      case 'Verification':
        return 'El enlace de verificación ha expirado.';
      default:
        return 'Ocurrió un error durante la autenticación.';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-destructive">
          Error de Autenticación
        </CardTitle>
        <CardDescription>{getErrorMessage(error)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Si el problema persiste, contacta al administrador del sistema.
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/signin">Intentar de nuevo</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * AuthErrorPage - Wrapped in Suspense for useSearchParams compatibility
 */
export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando...</div>
            </CardContent>
          </Card>
        }
      >
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
