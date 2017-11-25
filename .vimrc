set nocompatible              " be iMproved, required
filetype off                  " required

syntax on
colorscheme onedark
set number
set cursorline
set autoindent
set smartindent
set cindent
set shiftwidth=4

map <C-z> :NERDTreeToggle<CR>

let g:airline_theme='deus'
let g:airline_powerline_fonts = 1
let g:airline#extensions#tabline#enabled = 1 
let g:ycm_global_ycm_extra_conf = '~/.vim/plugged/YouCompleteMe/third_party/ycmd/cpp/ycm/.ycm_extra_conf.py'

call plug#begin('~/.vim/plugged')
Plug 'tpope/vim-fugitive'
Plug 'git://git.wincent.com/command-t.git'
Plug 'joshdick/onedark.vim'
Plug 'vim-syntastic/syntastic'
Plug 'scrooloose/nerdtree'
Plug 'Valloric/YouCompleteMe'
Plug 'airblade/vim-gitgutter'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'Townk/vim-autoclose'
Plug 'yuttie/comfortable-motion.vim'
Plug 'ryanoasis/vim-devicons'
call plug#end()

set guifont=Sauce\ Code\ Pro\ Nerd\ Font\ Complete\ Mono\ 12
