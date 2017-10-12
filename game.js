'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new SyntaxError("Прибавлять к вектору можно только вектор типа Vector");
        }
        return new Vector(this.x + vector.x, this.y + vector.y);
    }
    times(factor) {
        return new Vector(this.x*factor, this.y*factor);
    }
}

class Actor {
    constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
        if (!(pos instanceof Vector && size instanceof Vector && speed instanceof Vector)) {
            // не стоит использовать SyntaxError: это внутренний тип, вручную такие ошибки лучше не создавать
            // к тому же ошибка в данном случае не синтаксическая
            // просто Error достаточно
            throw new SyntaxError("Все параметры должны быть типа Vector");
        }
        this.pos = pos;
        this.size = size;
        this.width = this.size.x;
        this.height = this.size.y;
        this.speed = speed;
        // лишнее
        this._type = 'actor';
        // объявить как свойство класса
        Object.defineProperty(this, "left", {
            get: function() {
                return this.pos.x;
            }
        });
        Object.defineProperty(this, "right", {
            get: function() {
                return this.pos.x + this.size.x;
            }
        });
        Object.defineProperty(this, "top", {
            get: function() {
                return this.pos.y;
            }
        });
        Object.defineProperty(this, "bottom", {
            get: function() {
                return this.pos.y + this.size.y;
            }
        });
    }
    get type() {
        // здесь сразу можно строку вернуть
        return this._type;
    }
    isIntersect(obj) {
        if (!(obj instanceof Actor)) {
            // SyntaxError
            throw new SyntaxError("Нужно передать движущийся объект типа Actor");
        }

        // obj === this можно выделить в отдельную проверку
        // остальные условия можно обратить чтобы написать сразу return <expr>
        if ((obj.left >= this.right || obj.right <= this.left || obj.top >= this.bottom || obj.bottom <= this.top) || (obj === this)) {
            return false;
        }
        return true;
    }
    act() {}
}

class Level {
    constructor(grid = [], actors = []) {
        this.height = grid.length;
        // здесь можно написать красиво через Math.max и .map
        this.width = grid.reduce((width, line) => line.length > width ? line.length : width, 0);
        // тут лучше создать копии массивов, чтобы поля класса нельзя было изменить извне
        this.grid = grid;
        this.actors = actors;
        this.player = this.actors.find(actor => actor.type === 'player');
        this.status = null;
        this.finishDelay = 1;
    }
    isFinished() {
        // тут ошибка
        if (status !== null && this.finishDelay < 0) {
            return true;
        }
        return false;
    }
    actorAt(actor) {
        // эту проверку, в принципе, можно опустить
        if (!(actor instanceof Actor)) {
            // SyntaxError
            throw new SyntaxError("Необходимо использовать объект типа Actor");
        }

        // .find
        for (let i = 0; i < this.actors.length; i++) {
            let obj = this.actors[i];
            if (actor.isIntersect(obj) && actor !== obj) {
                return obj;
            }
        }
        return undefined;
    }
    obstacleAt(pos, size) {
        if (!(pos instanceof Vector) || !(size instanceof Vector)) {
            // SyntaxError
            throw new SyntaxError("Прибавлять к вектору можно только вектор типа Vector");
        }

        // почему let? Значение этих переменных не меняется ведь
        let xStart = Math.floor(pos.x);
        let xEnd = Math.ceil(pos.x + size.x);
        let yStart = Math.floor(pos.y);
        let yEnd = Math.ceil(pos.y + size.y);
        if (xStart < 0 || xEnd > this.width || yStart < 0) {
            return "wall";
        }
        if (yEnd > this.height) {
            return "lava";
        }
        for (let y = yStart; y < yEnd; y++) {
            for (let x = xStart; x < xEnd; x++) {
                // переменную объявили, но не используете
                let fieldType = this.grid[y][x];
                // тут можно просто if (..) (без сравнения с undefined)
                if (this.grid[y][x] !== undefined) {
                    return this.grid[y][x];
                }
            }
        }
    }
    removeActor(actor) {
        this.actors = this.actors.filter(other => other !== actor);
    }
    noMoreActors(type) {
        // можно в одну строчку с использованием .some
        if (this.actors.length === 0) {
            return true;
        }
        for (let actorIn of this.actors) {
            if (actorIn.type === type) {
                return false;
            }
        }
        return true;
    }
    playerTouched(touchType, actor) {
        if (touchType === 'lava' || touchType === 'fireball') {
            this.status = 'lost';
            // здесь можно написать return и убрать else
        } else if (touchType === 'coin') {
            this.removeActor(actor);
            if (this.noMoreActors('coin')) {
                this.status = 'won';
            }
        }
    }
}

class LevelParser {
    // некорректное значение по-умолчанию
    constructor(dictionaryActors = []) {
        // здесь лучше создать копию объекта
        this.dictionaryActors = dictionaryActors;
    }
    actorFromSymbol(symbol) {
        // очень странная проверка
        if (symbol == Object.keys(this.dictionaryActors)) {
            return this.dictionaryActors[symbol];
        }
        return undefined;
    }
    obstacleFromSymbol(symbol) {
        // может быть switch был бы здесь уместнее?
        if (symbol === 'x') {
            return 'wall';
        }
        if (symbol === '!') {
            return 'lava';
        }
        // это можно не писать - undefined возвращается и так
        return undefined;
    }
    createGrid(array) {
        let grid = [];
        // форматирование поехало
        // записывается короче с помощью .max
        array.forEach(row => {
            let line = row.split('');
        for (let cell of line) {
            // дублирование obstacleFromSymbol
            if (cell === 'x') {
                line[line.indexOf(cell)] = 'wall';
            } else if (cell === '!') {
                line[line.indexOf(cell)] = 'lava';
            } else {
                line[line.indexOf(cell)] = undefined;
            }
        }
        grid.push(line);
    });
        return grid;
    }
    createActors(array) {
        let grid = [];
        let indexY = 0;
        // поехало форматирование и вообще непонятно что происходит
        // line[line.indexOf(cell)] - зачем это?
        array.forEach(row => {
            let line = row.split('');
        let y = indexY++;
        line.forEach(cell => {
            if (cell === line[line.indexOf(cell)] && cell === line[line.indexOf(cell)] && typeof (this.dictionaryActors[line[line.indexOf(cell)]]) === 'function' && (new this.dictionaryActors[line[line.indexOf(cell)]]() instanceof Actor)) {
            grid.push(new this.dictionaryActors[line[line.indexOf(cell)]]((new Vector (line.indexOf(cell), y))));
            line[line.indexOf(cell)] = this.dictionaryActors;
        }
    });
    });
        return grid;
    }
    parse (array) {
        return new Level(this.createGrid(array), this.createActors(array));
    }
}

class Fireball extends Actor {
    // не стоит использовать конструктор Vector по-умолчанию, его кто-нибудь может поменять и всё сломается
    constructor(pos = new Vector(), speed = new Vector()) {
        super(pos);
        // pos, size и speed должны задаваться через конструктор родителя
        // мутировать объект плохо
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.speed.x = speed.x;
        this.speed.y = speed.y;
        // объявить просто свойством класса
        Object.defineProperty(this, "type", {
            value: 'fireball',
            writable: false,
        });
    }
    getNextPosition(time = 1) {
        return new Vector (this.speed.x*time+this.pos.x, this.speed.y*time+this.pos.y);
    }
    handleObstacle() {
        // мутировать объекты плохо
        this.speed.x *= -1;
        this.speed.y *= -1;
    }
    act(time, level) {
        let nextPosition = this.getNextPosition(time);
        let obstacle = level.obstacleAt(nextPosition, this.size);
        if (obstacle) {
            this.handleObstacle();
        } else {
            this.pos = nextPosition;
        }
    }
}

class HorizontalFireball extends Fireball {
    // было бы хорошо значение по-умолчанию добавить
    constructor(position) {
        super(position);
        // мутировать плохо и должно задаваться через базовый конструктор
        this.speed.x = 2;
        this.speed.y = 0;
    }
}

class VerticalFireball extends Fireball {
    // значение по-умолчанию
    constructor(position) {
        super(position);
        // мутировать плохо и должно задаваться через базовый конструктор
        this.speed.x = 0;
        this.speed.y = 2;
    }
}

class FireRain extends Fireball {
    // значение по-умолчанию
    constructor(position) {
        super(position);
        // мутировать плохо и должно задаваться через базовый конструктор
        this.speed.x = 0;
        this.speed.y = 3;
        this.startPos = position;
    }
    handleObstacle() {
        this.pos = this.startPos;
    }
}

class Coin extends Actor {
    // конструктор принимает 1 аргумент
    constructor(position = new Vector(), size = new Vector(0.6, 0.6)) {
        super(position, size);
        // поле лучше назвать как-нибудь по-другому: basePos, например
        this.position = position;
        // должно задаваться через конструктор
        this.pos.x += 0.2;
        this.pos.y += 0.1;
        // скобки лишние
        this.spring = Math.random() * (Math.PI * 2);
        this.springSpeed = 8;
        this.springDist = 0.07;
        // свойство класса
        Object.defineProperty(this, "type", {
            value: 'coin',
        });
    }
    updateSpring(time = 1) {
        // скобки лишние
        this.spring = this.spring + (this.springSpeed * time);
    }
    getSpringVector() {
        // лишние скобки :)
        return new Vector (0, (Math.sin(this.spring) * this.springDist));
    }
    getNextPosition(time) {
        this.updateSpring(time);
        // объявили переменную и не используете
        const newVector = this.getSpringVector();
        return this.position.plus(this.getSpringVector());
    }
    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos = new Vector(0,0)) {
        super(pos, new Vector(0.8, 1.5));
        // должно задаваться через родительский конструктор
        this.pos.y = pos.y - 0.5;
        // свойство класса
        Object.defineProperty(this, "type", {
            value: 'player',
        });
    }
}

const actorDict = {
    '@': Player,
    'v': FireRain,
    '=': HorizontalFireball,
    '|': VerticalFireball,
    'o': Coin
} // тут точка с запятой должна быть :)
const parser = new LevelParser(actorDict);

loadLevels()
    .then(schemas => runGame(JSON.parse(schemas), parser, DOMDisplay))
// форматирование (отступы забыли)
.then(() => alert('Вы выиграли приз!'))
.catch(err => alert(err));

