import React from 'react'

const Header = ({ title, subtitle, rightElement }: { title: string, subtitle?: string, rightElement?: React.ReactNode }) => {
  return (
    <div className="flex justify-between items-center w-full mb-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {rightElement && (
         <div className="flex gap-2">
            {rightElement}
         </div>
      )}
    </div>
  )
}

export default Header
