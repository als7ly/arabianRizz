import React from 'react'

const Header = ({ title, subtitle, rightElement }: { title: string, subtitle?: string, rightElement?: React.ReactNode }) => {
  return (
    <div className="flex justify-between items-center w-full">
        <div>
            <h2 className="h2-bold text-dark-600">{title}</h2>
            {subtitle && <p className="p-16-regular mt-2 text-dark-400">{subtitle}</p>}
        </div>
        {rightElement && <div>{rightElement}</div>}
    </div>
  )
}

export default Header
