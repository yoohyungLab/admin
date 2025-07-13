import * as React from 'react';

import { Icon } from 'lucide-react';

interface InputProps extends React.ComponentProps<'input'> {
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>((props) => {
    const { className, icon, type, placeholder } = props;
    return (
        <div className="relative">
            {icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" iconNode={[]} />}
            <input
                type={type}
                placeholder={placeholder}
                className={`w-full h-12 rounded-xl border border-gray-200 bg-white px-12 text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all ${className}`}
                {...props}
            />
        </div>
    );
});
Input.displayName = 'Input';

export { Input };
