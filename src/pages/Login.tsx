import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, Building, User } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { loginSchema, registerSchema } from '../lib/schemas';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export interface LoginProps {
  className?: string;
}

export const Login: React.FC<LoginProps> = ({ className }) => {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [salonName, setSalonName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isSignUp) {
      const validation = registerSchema.safeParse({
        fullName,
        email,
        password,
        confirmPassword,
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.issues.forEach((err) => {
          const fieldName = String(err.path[0]);
          fieldErrors[fieldName] = err.message;
        });
        setErrors(fieldErrors);
        const firstError = validation.error.issues[0]?.message;
        if (firstError) toast.error(firstError);
        return;
      }

      try {
        await register({
          fullName,
          email,
          password,
          salonName: salonName || 'Meu Salão',
        });
        toast.success('Conta criada com sucesso! Bem-vindo(a) ao BelezaFlow.');
        navigate('/');
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao criar conta.');
      }
    } else {
      const validation = loginSchema.safeParse({
        email,
        password,
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.issues.forEach((err) => {
          const fieldName = String(err.path[0]);
          fieldErrors[fieldName] = err.message;
        });
        setErrors(fieldErrors);
        const firstError = validation.error.issues[0]?.message;
        if (firstError) toast.error(firstError);
        return;
      }

      try {
        await login(email, password);
        toast.success('Login realizado com sucesso!');
        navigate('/');
      } catch (err: any) {
        toast.error(err?.message || 'Falha ao autenticar.');
      }
    }
  };

  const handleQuickDemoAccess = async () => {
    setEmail('admin@belezaflow.com.br');
    setPassword('senha123');
    try {
      await login('admin@belezaflow.com.br', 'senha123');
      toast.success('Acesso com perfil de demonstração concedido!');
      navigate('/');
    } catch {
      toast.error('Erro ao acessar demonstração');
    }
  };

  return (
    <Card className={cn('p-6 sm:p-8', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {isSignUp ? 'Criar Conta no BelezaFlow' : 'Acessar seu Salão'}
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          {isSignUp
            ? 'Comece agora a organizar a sua agenda e clientes'
            : 'Entre com seu e-mail e senha de administradora'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <Input
              label="Seu Nome Completo *"
              placeholder="Ex: Amanda Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              required
              icon={<User className="w-4 h-4 text-slate-400" />}
            />
            <Input
              label="Nome do Salão ou Studio"
              placeholder="Ex: Studio Alisa & Spa"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              icon={<Building className="w-4 h-4 text-slate-400" />}
            />
          </>
        )}

        <Input
          label="E-mail *"
          type="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          icon={<Mail className="w-4 h-4 text-slate-400" />}
        />

        <div className="relative">
          <Input
            label="Senha *"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
            icon={<Lock className="w-4 h-4 text-slate-400" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors"
            title={showPassword ? 'Ocultar senha' : 'Ver senha'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {isSignUp && (
          <Input
            label="Confirmar Senha *"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repita sua senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
            icon={<Lock className="w-4 h-4 text-slate-400" />}
          />
        )}

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full mt-2"
        >
          {isSignUp ? 'Cadastrar Salão' : 'Entrar no Sistema'}
        </Button>
      </form>

      {/* Quick Demo Access button */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={handleQuickDemoAccess}
          className="w-full text-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          Entrar como Demonstração Rápida
        </Button>
      </div>

      {/* Toggle Sign up / Sign in */}
      <div className="mt-5 text-center text-xs text-slate-600">
        {isSignUp ? (
          <p>
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrors({});
              }}
              className="text-rose-500 font-semibold hover:underline cursor-pointer"
            >
              Fazer Login
            </button>
          </p>
        ) : (
          <p>
            Novo no BelezaFlow?{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrors({});
              }}
              className="text-rose-500 font-semibold hover:underline cursor-pointer"
            >
              Cadastre seu Salão
            </button>
          </p>
        )}
      </div>
    </Card>
  );
};
