import type { InputHTMLAttributes } from 'react';
import { Input } from './Input';

export const DatePicker = (props: InputHTMLAttributes<HTMLInputElement>) => <Input type="date" {...props} />;
