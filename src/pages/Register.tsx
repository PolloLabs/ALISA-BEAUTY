import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Building, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { registerSchema } from '@/lib/schemas'

export function Register() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuth()
  const [fullName, setFullName] = useState('')
  const [salonName, setSalonName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

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
      toast.success('Conta criada com sucesso! Bem-vindo(a) ao BelezaFlow.')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao criar conta. Tente novamente.')
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Criar Conta no BelezaFlow</h2>
        <p className="text-xs text-slate-600 mt-1">
          Cadastre seu salão e comece a gerenciar clientes e agendamentos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Mínimo 6 caracteres"
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
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

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

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full mt-2"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          Cadastrar Salão
        </Button>
      </form>

      <div className="mt-5 text-center text-xs text-slate-600">
        <p>
          Já tem uma conta?{' '}
          <Link to="/login" className="text-rose-500 font-semibold hover:underline">
            Fazer Login
          </Link>
        </p>
      </div>
    </Card>
  )
}
