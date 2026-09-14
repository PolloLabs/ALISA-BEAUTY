import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Crown, Scissors, ArrowRight, Sparkles, Building, User } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth, AuthUser, seedDemoProfessionalsIfEmpty } from '../contexts/AuthContext'
import { loginSchema, registerSchema } from '../lib/schemas'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

export interface LoginProps {
  className?: string
}

export const Login: React.FC<LoginProps> = ({ className }) => {
  const navigate = useNavigate()
  const { login, register, isLoading } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [salonName, setSalonName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Garante que o profissional de demonstração 'Ana Clara' seja semeado no carregamento
  useEffect(() => {
    seedDemoProfessionalsIfEmpty()
  }, [])

  const routeUserAfterLogin = (authUser: AuthUser) => {
    if (authUser.role === 'super_admin') {
      navigate('/admin')
    } else if (authUser.role === 'employee') {
      navigate('/agenda')
    } else if (authUser.role === 'owner') {
      if (authUser.plan_status === 'active') {
        navigate('/')
      } else {
        navigate('/plan-gate')
      }
    } else {
      navigate('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (isSignUp) {
      const validation = registerSchema.safeParse({
        fullName,
        email,
        password,
        confirmPassword,
      })

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {}
        validation.error.issues.forEach((err) => {
          const fieldName = String(err.path[0])
          fieldErrors[fieldName] = err.message
        })
        setErrors(fieldErrors)
        const firstError = validation.error.issues[0]?.message
        if (firstError) toast.error(firstError)
        return
      }

      try {
        await register({
          fullName,
          email,
          password,
          salonName: salonName || 'Meu Salão',
        })
        toast.success('Salão cadastrado com sucesso! Ative seu plano para começar.')
        navigate('/plan-gate')
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao criar conta.')
      }
    } else {
      const validation = loginSchema.safeParse({
        email,
        password,
      })

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {}
        validation.error.issues.forEach((err) => {
          const fieldName = String(err.path[0])
          fieldErrors[fieldName] = err.message
        })
        setErrors(fieldErrors)
        const firstError = validation.error.issues[0]?.message
        if (firstError) toast.error(firstError)
        return
      }

      try {
        const authUser = await login(email, password)
        toast.success(`Bem-vindo(a), ${authUser.fullName || 'ao BelezaFlow'}!`)
        routeUserAfterLogin(authUser)
      } catch (err: any) {
        toast.error(err?.message || 'Falha ao autenticar.')
      }
    }
  }

  // Preenchimento rápido para teste de perfis
  const fillCredentials = (type: 'admin' | 'owner' | 'employee') => {
    if (type === 'admin') {
      setEmail('admin@belezaflow.com')
      setPassword('admin123')
    } else if (type === 'owner') {
      setEmail('owner@demo.com')
      setPassword('owner123')
    } else {
      setEmail('ana.clara@belezaflow.com')
      setPassword('pro1123')
    }
  }

  return (
    <Card className={cn('p-6 sm:p-8 bg-white border border-slate-200 shadow-xl rounded-2xl', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 font-luxury">
          {isSignUp ? 'Criar Conta no BelezaFlow' : 'Login no Sistema'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isSignUp
            ? 'Cadastre seu estabelecimento e comece a faturar mais'
            : 'Entre com suas credenciais de perfil (Admin, Dono ou Profissional)'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <Input
              label="Seu Nome Completo *"
              placeholder="Ex: Amanda Rocha"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              required
              icon={<User className="w-4 h-4 text-slate-400" />}
            />
            <Input
              label="Nome do Salão ou Studio"
              placeholder="Ex: Studio BelezaFlow & Spa"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              icon={<Building className="w-4 h-4 text-slate-400" />}
            />
          </>
        )}

        <Input
          label="E-mail de Acesso *"
          type="email"
          placeholder="exemplo@email.com"
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
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
            icon={<Lock className="w-4 h-4 text-slate-400" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {isSignUp && (
          <Input
            label="Confirme sua Senha *"
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
          className="w-full mt-2 bg-slate-900 text-amber-400 hover:bg-slate-800"
        >
          {isSignUp ? 'Cadastrar Salão' : 'Entrar no Sistema'}
        </Button>
      </form>

      {/* Atalhos Rápidos para Testes dos 3 Perfis */}
      {!isSignUp && (
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
            Perfis de Demonstração (Clique para preencher):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="p-2 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-900 font-medium text-left flex flex-col cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                Super Admin
              </div>
              <span className="text-[10px] text-purple-700/80 font-mono mt-0.5 truncate">admin@belezaflow.com</span>
              <span className="text-[10px] text-slate-500 font-mono">admin123</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('owner')}
              className="p-2 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-900 font-medium text-left flex flex-col cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1 font-bold text-[11px]">
                <Crown className="w-3.5 h-3.5 text-amber-700" />
                Dono do Salão
              </div>
              <span className="text-[10px] text-amber-700/80 font-mono mt-0.5 truncate">owner@demo.com</span>
              <span className="text-[10px] text-slate-500 font-mono">owner123</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('employee')}
              className="p-2 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-900 font-medium text-left flex flex-col cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1 font-bold text-[11px]">
                <Scissors className="w-3.5 h-3.5 text-blue-700" />
                Profissional
              </div>
              <span className="text-[10px] text-blue-700/80 font-mono mt-0.5 truncate">ana.clara@belezaflow.com</span>
              <span className="text-[10px] text-slate-500 font-mono">pro1123</span>
            </button>
          </div>
        </div>
      )}

      {/* Alternar Cadastro / Login */}
      <div className="mt-5 text-center text-xs text-slate-600">
        {isSignUp ? (
          <p>
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false)
                setErrors({})
              }}
              className="text-amber-600 font-semibold hover:underline cursor-pointer"
            >
              Fazer Login
            </button>
          </p>
        ) : (
          <p>
            É dono de um salão e ainda não tem conta?{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true)
                setErrors({})
              }}
              className="text-amber-600 font-semibold hover:underline cursor-pointer"
            >
              Cadastre-se grátis
            </button>
          </p>
        )}
      </div>
    </Card>
  )
}
