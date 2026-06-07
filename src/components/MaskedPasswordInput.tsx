import React, { useState, useEffect, useRef } from 'react';

interface MaskedPasswordInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export default function MaskedPasswordInput({
  value,
  onChange,
  className,
  placeholder,
  required
}: MaskedPasswordInputProps) {
  const [internalDisplay, setInternalDisplay] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Force sync when parent clears the value or it gets reset
    if (!value) {
      setInternalDisplay('');
    } else if (internalDisplay.length !== value.length) {
      setInternalDisplay('•'.repeat(value.length));
    }
  }, [value, internalDisplay.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Deletion support
    if (val.length < value.length) {
      const newValue = value.slice(0, val.length);
      setInternalDisplay('•'.repeat(newValue.length));
      onChange(newValue);
      return;
    }

    // Appending support
    const addedCount = val.length - value.length;
    if (addedCount > 0) {
      const newChar = val.slice(val.length - addedCount);
      const newValue = value + newChar;
      
      // Temporary: previous characters are masked, latest additions are plain
      setInternalDisplay('•'.repeat(value.length) + newChar);
      onChange(newValue);

      // Mask after brief visibility timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setInternalDisplay('•'.repeat(newValue.length));
      }, 800);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <input
      type="text"
      value={internalDisplay}
      onChange={handleChange}
      className={`${className} font-mono`}
      placeholder={placeholder}
      required={required}
    />
  );
}
