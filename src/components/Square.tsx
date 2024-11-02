interface SquareProps {
    value: number | null; // Adjust the type as needed
    onSquareClick: () => void;
}

const Square: React.FC<SquareProps> = ({ value, onSquareClick }) => {
    let content: string;
    if (value === 1) {
        content = 'O';
    } else if (value === 2) {
        content = 'X';
    } else {
        content = '';
    }

    return (
        <>
            <div className='flex h-[90px] w-[90px] md:h-[100px] md:w-[100px] items-center justify-center bg-[#1f3540] rounded-2xl shadow-md active:scale-125 transition duration-200 ease-in hover:bg-[#18272e] shadow-gray-400/30 text-white text-3xl' onClick={onSquareClick}>
                {content}
            </div>
        </>
    );
};

export default Square;
