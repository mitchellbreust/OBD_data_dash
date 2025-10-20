package adapter

type Adapter interface {
	Connect() error 
	Close() error
	Write(req []byte) (int, error) // returns either number of bytes written or error
	Read() ([]byte, error) // returns either number of bytes written or erro
}
