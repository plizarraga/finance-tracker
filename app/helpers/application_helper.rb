module ApplicationHelper
  def label_class
      "block text-sm font-medium text-gray-700"
    end
  
    def input_class
      "block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
    end
  
    def form_button_class
      "flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    end

    def active_link_to(
      text = nil, 
      path = nil, 
      active_classes: 'border-indigo-500 text-gray-900', 
      inactive_classes: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
      default_classes: 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
      **options, 
      &block)
      path ||= text
      
      # Check if the current request path starts with the given path
      current_path = request.fullpath
      is_active = (current_path == path) || (path != root_path && current_path.start_with?(path) && current_path != root_path)
    
      # Assign the appropriate classes based on the path match
      options[:class] = is_active ? active_classes : inactive_classes
      options[:class] += ' ' + default_classes
    
      # Render the link
      if block_given?
        link_to(path, options, &block)
      else
        link_to(text, path, options)
      end
    end
end
