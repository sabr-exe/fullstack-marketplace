import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../api/client';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  birth_date: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
    message: 'Valid birth date required',
  }),
  gender: z.enum(['male', 'female']),
});

type RegisterFormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => api.post('/auth/register/', data),
    onSuccess: () => {
      toast.success('Registration successful! Please login.');
      navigate('/login');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || error.response?.data?.email?.[0] || 'Registration failed';
      toast.error(msg);
    },
  });

  return (
    <div className="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create an account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit((data) => registerMutation.mutate(data))}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} />
              <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} />
            </div>
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Birth Date" type="date" {...register('birth_date')} error={errors.birth_date?.message} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select 
                  {...register('gender')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-danger">{errors.gender.message}</p>}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
            Register
          </Button>

          <div className="text-center text-sm">
             <Link to="/login" className="font-medium text-primary hover:text-secondary">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;