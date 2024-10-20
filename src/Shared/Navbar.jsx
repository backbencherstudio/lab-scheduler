import React from 'react'
import logo from './../assets/logo.png'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className='container mx-auto flex justify-between items-center mt-5 md:mt-10 px-4 xl:px-0 '>
      <div>
        <Link to='/'><img src={logo} alt="" className='w-32 md:w-[180px]' /></Link>
      </div>
      <div className='flex gap-5 items-center'>
        <Link to='/login' className='uppercase font-semibold'>login</Link>
        <span className='text-xl font-thin mb-1.5'>|</span>
        <Link to='/register' className='uppercase font-semibold'>register</Link>
      </div>
    </nav>
  )
}

export default Navbar