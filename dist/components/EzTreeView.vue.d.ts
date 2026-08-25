declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    options: {
        type: ObjectConstructor;
        default: () => {};
    };
    preset: {
        type: StringConstructor;
        default: any;
    };
    autoGenerate: {
        type: BooleanConstructor;
        default: boolean;
    };
    grassCount: {
        type: NumberConstructor;
        default: number;
    };
    skybox: {
        type: (ObjectConstructor | BooleanConstructor)[];
        default: boolean;
    };
    showGround: {
        type: BooleanConstructor;
        default: boolean;
    };
    shadows: {
        type: BooleanConstructor;
        default: boolean;
    };
    cameraTarget: {
        type: ObjectConstructor;
        default: () => {
            x: number;
            y: number;
            z: number;
        };
    };
    cameraPosition: {
        type: ObjectConstructor;
        default: () => {
            x: number;
            y: number;
            z: number;
        };
    };
    leafColor: {
        type: (StringConstructor | NumberConstructor)[];
        default: any;
    };
    leafCount: {
        type: NumberConstructor;
        default: any;
    };
    backgroundImage: {
        type: (ObjectConstructor | StringConstructor | BooleanConstructor)[];
        default: any;
    };
}>, {
    generate: typeof generate;
    getTree: () => any;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    generate: (...args: any[]) => void;
    error: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    options: {
        type: ObjectConstructor;
        default: () => {};
    };
    preset: {
        type: StringConstructor;
        default: any;
    };
    autoGenerate: {
        type: BooleanConstructor;
        default: boolean;
    };
    grassCount: {
        type: NumberConstructor;
        default: number;
    };
    skybox: {
        type: (ObjectConstructor | BooleanConstructor)[];
        default: boolean;
    };
    showGround: {
        type: BooleanConstructor;
        default: boolean;
    };
    shadows: {
        type: BooleanConstructor;
        default: boolean;
    };
    cameraTarget: {
        type: ObjectConstructor;
        default: () => {
            x: number;
            y: number;
            z: number;
        };
    };
    cameraPosition: {
        type: ObjectConstructor;
        default: () => {
            x: number;
            y: number;
            z: number;
        };
    };
    leafColor: {
        type: (StringConstructor | NumberConstructor)[];
        default: any;
    };
    leafCount: {
        type: NumberConstructor;
        default: any;
    };
    backgroundImage: {
        type: (ObjectConstructor | StringConstructor | BooleanConstructor)[];
        default: any;
    };
}>> & Readonly<{
    onGenerate?: (...args: any[]) => any;
    onError?: (...args: any[]) => any;
}>, {
    skybox: boolean | Record<string, any>;
    options: Record<string, any>;
    preset: string;
    autoGenerate: boolean;
    grassCount: number;
    showGround: boolean;
    shadows: boolean;
    cameraTarget: Record<string, any>;
    cameraPosition: Record<string, any>;
    leafColor: string | number;
    leafCount: number;
    backgroundImage: string | boolean | Record<string, any>;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>;
declare function generate(): void;
