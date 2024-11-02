import '../App.css'
function Square({ chooseSquare, val }: any) {
    return (
        <div className="square" onClick={chooseSquare}>
            {val}
        </div>
    );
}

export default Square;