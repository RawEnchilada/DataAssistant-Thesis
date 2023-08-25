export default interface DBConnection {
    connect(): void;
    disconnect(): void;
    query(query: string): Promise<Array<{ [key: string]: any }>>;
}
