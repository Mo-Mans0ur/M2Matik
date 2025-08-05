import {useNavigate } from 'react-router-dom';

export default function FrontPage() {
    const navigate = useNavigate();


    return (
        <div className='flex flex-col items-center jutify-center min-h-screen bg-gray-100'>
            <h1 className='text-3xl font-bold mb-8'>Vælg en ejendomstype</h1>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <button onClick={() => navigate('/house')}
                className='bg-gray-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg text-xl'
                >Hus
                </button>
                <button onClick={() => navigate('/apartment')}
                className='bg-gray-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg text-xl'
                >Lejlighed
                </button>
                <button onClick={() => navigate('/summerhouse')}
                className='bg-gray-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg text-xl'
                >Sommerhus
                </button>
            </div>
            <div className='mt-8'>
                <button onClick={() => navigate('/')}
                className='bg-gray-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg text-xl'
                >Tilbage
                </button>
            </div>
        </div>
    );
}